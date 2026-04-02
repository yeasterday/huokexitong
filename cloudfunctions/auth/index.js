const cloud = require('wx-server-sdk');
const crypto = require('crypto');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

function hashPassword(password) {
  return crypto.createHash('sha256').update(`huokexitong:${password}`).digest('hex');
}

function cleanUser(user) {
  if (!user) return null;
  const safeUser = { ...user };
  delete safeUser.password;
  delete safeUser.passwordHash;
  return safeUser;
}

async function getUserByOpenId(openId) {
  const res = await db.collection('users').where({ wxOpenId: openId }).limit(1).get();
  return res.data[0] || null;
}

async function getUserByAccount(account) {
  const res = await db.collection('users').where({ account }).limit(1).get();
  return res.data[0] || null;
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { action } = event;

  try {
    if (action === 'checkSession') {
      const user = await getUserByOpenId(OPENID);
      return {
        success: true,
        user: cleanUser(user),
      };
    }

    if (action === 'login') {
      const { account, password } = event;
      if (!account || !password) {
        return { success: false, message: '请输入账号和密码' };
      }

      const user = await getUserByAccount(account);
      if (!user) {
        return { success: false, message: '账号或密码错误' };
      }

      const passwordHash = hashPassword(password);
      const isMatched = user.passwordHash
        ? user.passwordHash === passwordHash
        : user.password === password;

      if (!isMatched) {
        return { success: false, message: '账号或密码错误' };
      }

      await db.collection('users').doc(user._id).update({
        data: {
          wxOpenId: OPENID,
          passwordHash: user.passwordHash || passwordHash,
          lastLoginTime: db.serverDate(),
        },
      });

      const latest = await db.collection('users').doc(user._id).get();
      return {
        success: true,
        user: cleanUser(latest.data),
      };
    }

    if (action === 'register') {
      const {
        account,
        nickname,
        password,
        inviteCode = '',
      } = event;

      if (!account || !nickname || !password) {
        return { success: false, message: '请填写完整注册信息' };
      }

      if (!/^1[3-9]\d{9}$/.test(account)) {
        return { success: false, message: '请输入正确的手机号' };
      }

      if (password.length < 8) {
        return { success: false, message: '密码长度不能少于 8 位' };
      }

      const existed = await getUserByAccount(account);
      if (existed) {
        return { success: false, message: '该手机号已注册，请直接登录' };
      }

      let orgId = '';
      let orgName = '';
      let teacherId = '';

      if (inviteCode) {
        const teacherRes = await db.collection('users').where({
          inviteCode,
          role: 'teacher',
        }).limit(1).get();

        if (!teacherRes.data.length) {
          return { success: false, message: '邀请码无效，请核对后重试' };
        }

        const teacher = teacherRes.data[0];
        teacherId = teacher._id;
        orgId = teacher.orgId || teacher._id;
        orgName = teacher.orgName || teacher.name || '默认校区';
      }

      const addRes = await db.collection('users').add({
        data: {
          account,
          phone: account,
          passwordHash: hashPassword(password),
          name: nickname,
          nickname,
          score: 100,
          role: 'student',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${account}`,
          createTime: db.serverDate(),
          wxOpenId: OPENID,
          orgId,
          orgName,
          teacherId,
          profile: {
            grade: '',
            city: '',
            targetSchool: '',
            learningGoal: '',
            bio: '',
          },
        },
      });

      const latest = await db.collection('users').doc(addRes._id).get();
      return {
        success: true,
        user: cleanUser(latest.data),
      };
    }

    return {
      success: false,
      message: '未知操作',
    };
  } catch (error) {
    console.error('auth function error', error);
    return {
      success: false,
      message: error.message || '操作失败，请稍后重试',
    };
  }
};
