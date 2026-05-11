// 认证相关功能
import API_CONFIG, { apiRequest } from '../api/api-config.js';
import router from '../router';

export default class Auth {
    constructor() {
        this.init();
    }

    init() {
        // 检查页面类型并初始化相应功能
        if (window.location.pathname === '/' || window.location.pathname.includes('index.html')) {
            this.initAuthForms();
        } else {
            this.checkLoginStatus();
            this.initLogout();
            this.controlUIBasedOnRole();
        }
    }

    // 初始化登录注册表单
    initAuthForms() {
        // 标签切换
        const tabBtns = document.querySelectorAll('.tab-btn');
        const formContents = document.querySelectorAll('.form-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');
                
                // 移除所有激活状态
                tabBtns.forEach(b => b.classList.remove('active'));
                formContents.forEach(c => c.classList.remove('active'));
                
                // 添加当前激活状态
                btn.classList.add('active');
                document.getElementById(targetTab).classList.add('active');
            });
        });

        // 登录按钮事件
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                this.login();
            });
        }

        // 注册按钮事件
        const registerBtn = document.getElementById('register-btn');
        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                this.register();
            });
        }
    }

    // 登录功能
    async login() {
        const phone = document.getElementById('login-phone').value;
        const password = document.getElementById('login-password').value;
        const errorElement = document.getElementById('login-error');

        // 清除之前的错误信息
        errorElement.textContent = '';

        try {
            // 使用封装的apiRequest请求工具
            const data = await apiRequest(API_CONFIG.baseURL + API_CONFIG.paths.user.login, {
                method: 'POST',
                body: JSON.stringify({
                    phone: phone,
                    password: password
                })
            });
            
            if (data.code === 200 && data.data) {
                // 保存token和用户信息
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data));
            localStorage.setItem('user_id', data.data.user_id || data.data.id);
            localStorage.setItem('isLoggedIn', 'true');
            // 跳转到首页
            router.push('/home');
            } else {
                // 显示错误信息
                errorElement.textContent = data.msg || '登录失败';
            }
        } catch (error) {
            console.error('登录错误:', error);
            // 显示错误信息
            errorElement.textContent = error.message || '登录失败，请稍后重试';
        }
    }

    // 注册功能
    async register() {
        const nickname = document.getElementById('register-nickname').value;
        const phone = document.getElementById('register-phone').value;
        const password = document.getElementById('register-password').value;
        const errorElement = document.getElementById('register-error');

        // 清除之前的错误信息
        errorElement.textContent = '';

        // 验证昵称长度
        if (nickname.length < 2 || nickname.length > 20) {
            errorElement.textContent = '昵称长度应为2-20字';
            return;
        }

        try {
            // 使用封装的apiRequest请求工具
            const data = await apiRequest(API_CONFIG.baseURL + API_CONFIG.paths.user.register, {
                method: 'POST',
                body: JSON.stringify({
                    nickname: nickname,
                    phone: phone,
                    password: password
                })
            });
            
            if (data.code === 200) {
                // 切换到登录标签
                document.querySelector('[data-tab="login"]').click();
                // 自动填充登录信息
                document.getElementById('login-phone').value = phone;
                document.getElementById('login-password').value = password;
                // 显示注册成功提示
                document.getElementById('login-error').textContent = '注册成功，请登录';
            } else {
                // 显示错误信息
                errorElement.textContent = data.msg || '注册失败';
            }
        } catch (error) {
            console.error('注册错误:', error);
            // 显示错误信息
            errorElement.textContent = error.message || '注册失败，请稍后重试';
        }
    }

    // 检查登录状态
    checkLoginStatus() {
        if (!this.isLoggedIn()) {
            router.push('/');
            return;
        }

        // 如果是个人展厅页面，显示用户信息
        if (window.location.pathname.includes('personal.html')) {
            this.displayUserInfo();
        }
    }

    // 显示用户信息
    displayUserInfo() {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            document.getElementById('user-name').textContent = user.nickname || user.name;
            document.getElementById('user-email').textContent = user.phone + '@example.com';
        }
    }

    // 初始化退出登录
    initLogout() {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }

    // 退出登录功能
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('user_id');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentFamilyId');
        localStorage.removeItem('currentUserId');
        localStorage.removeItem('currentFamilyRole');
        router.push('/');
    }

    // 获取认证令牌
    getToken() {
        return localStorage.getItem('token');
    }

    // 获取当前用户
    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }
    
    // 获取当前家族信息
    getCurrentFamilyInfo() {
        return {
            familyId: localStorage.getItem('currentFamilyId'),
            userId: localStorage.getItem('currentUserId'),
            role: localStorage.getItem('currentFamilyRole')
        };
    }
    
    // 检查用户是否已登录
    isLoggedIn() {
        return !!localStorage.getItem('isLoggedIn');
    }
    
    // 检查用户是否是管理员
    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.role === 'admin';
    }
    
    // 检查用户是否有某个权限
    hasPermission(permission) {
        const user = this.getCurrentUser();
        if (!user) return false;
        
        // 管理员拥有所有权限
        if (this.isAdmin()) return true;
        
        // 普通用户权限
        const userPermissions = [
            'view_personal_content',
            'view_family_content',
            'edit_personal_content',
            'basic_family_edit'
        ];
        
        return userPermissions.includes(permission);
    }
    
    // 根据角色控制UI元素显示
    controlUIBasedOnRole() {
        const user = this.getCurrentUser();
        if (!user) return;
        
        // 获取当前选择的家族ID
        const currentFamilyId = localStorage.getItem('currentFamilyId');
        
        // 检查用户在当前家族中的角色
        let isFamilyAdmin = false;
        if (currentFamilyId && user.families) {
            const familyRole = user.families.find(f => f.id === currentFamilyId);
            isFamilyAdmin = familyRole && familyRole.role === 'admin';
        }
        
        // 控制家族展厅中的管理按钮
        const adminButtons = [
            'add-family-member',
            'add-family-story'
        ];
        
        adminButtons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                if (isFamilyAdmin) {
                    button.style.display = 'inline-block';
                } else {
                    button.style.display = 'none';
                }
            }
        });
        
        // 控制家族管理区域显示
        if (window.location.pathname.includes('family.html')) {
            const adminSection = document.getElementById('admin-management-section');
            const joinSection = document.getElementById('join-family-section');
            
            if (adminSection && joinSection) {
                if (isFamilyAdmin) {
                    // 家族管理员显示管理区域
                    adminSection.style.display = 'block';
                    joinSection.style.display = 'none';
                    this.displayFamilyInvitationCode();
                } else {
                    // 个人用户显示加入家族区域
                    adminSection.style.display = 'none';
                    joinSection.style.display = 'block';
                    this.initJoinFamilyFunctionality();
                }
            }
        }
    }
    
    // 显示家族邀请码并绑定复制功能
    displayFamilyInvitationCode() {
        const user = this.getCurrentUser();
        if (!user) return;
        
        // 获取当前选择的家族ID
        const currentFamilyId = localStorage.getItem('currentFamilyId');
        if (!currentFamilyId) return;
        
        // 获取家族邀请码
        let invitationCode = '';
        
        // 从用户的家族列表中查找
        if (user.families) {
            const family = user.families.find(f => f.id === currentFamilyId);
            if (family && family.invitationCode) {
                invitationCode = family.invitationCode;
            }
        }
        
        // 如果用户是家族创建者，从用户信息中获取
        if (!invitationCode && user.type === 'family' && user.id === currentFamilyId) {
            invitationCode = user.invitationCode;
        }
        
        const codeElement = document.getElementById('family-invitation-code');
        const copyButton = document.getElementById('copy-invitation-code');
        
        if (codeElement) {
            codeElement.textContent = invitationCode || '暂无邀请码';
        }
        
        if (copyButton) {
            copyButton.addEventListener('click', () => {
                if (invitationCode) {
                    navigator.clipboard.writeText(invitationCode)
                        .then(() => {
                            alert('邀请码已复制到剪贴板！');
                        })
                        .catch(err => {
                            console.error('复制失败:', err);
                            alert('复制失败，请手动复制！');
                        });
                } else {
                    alert('暂无邀请码可复制');
                }
            });
        }
    }
    
    // 初始化加入家族功能
    initJoinFamilyFunctionality() {
        const joinButton = document.getElementById('join-family-btn');
        if (joinButton) {
            joinButton.addEventListener('click', () => {
                this.joinFamilyByInvitationCode();
            });
        }
    }
    
    // 通过邀请码加入家族
    async joinFamilyByInvitationCode() {
        const invitationCode = document.getElementById('join-invitation-code').value.trim();
        if (!invitationCode) {
            alert('请输入邀请码！');
            return;
        }
        
        try {
            const response = await fetch(API_CONFIG.baseURL + API_CONFIG.paths.family.join, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({
                    inviteCode: invitationCode
                })
            });

            const data = await response.json();
            
            if (data.code === 200) {
                alert('成功加入家族！');
                // 刷新页面或更新用户信息
                location.reload();
            } else {
                alert(data.msg || '加入家族失败');
            }
        } catch (error) {
            console.error('加入家族错误:', error);
            alert('加入家族失败，请稍后重试');
        }
    }
    
    // 获取我的家族信息列表
    async getMyFamilyInfo() {
        try {
            // 获取user_id
            const userId = localStorage.getItem('user_id');
            
            // 构建URL，将user_id作为query参数
            const url = `${API_CONFIG.baseURL}${API_CONFIG.paths.family.myListInfo}?user_id=${userId}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });

            const data = await response.json();
            
            if (data.code === 200) {
                return data.data || [];
            } else {
                console.error('获取家族信息失败:', data.msg);
                return [];
            }
        } catch (error) {
            console.error('获取家族信息错误:', error);
            return [];
        }
    }
    
    // 创建家族
    async createFamily(familyName) {
        if (!familyName || familyName.length < 2 || familyName.length > 20) {
            throw new Error('家族名称长度必须在2-20字之间');
        }
        
        try {
            const response = await fetch(API_CONFIG.baseURL + API_CONFIG.paths.family.create, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({
                    familyName: familyName
                })
            });

            const data = await response.json();
            
            if (data.code === 200) {
                return data;
            } else {
                throw new Error(data.msg || '创建家族失败');
            }
        } catch (error) {
            console.error('创建家族错误:', error);
            throw error;
        }
    }
    
    // 加入家族
    async joinFamily(inviteCode) {
        if (!inviteCode || inviteCode.length !== 6) {
            throw new Error('请输入6位邀请码');
        }
        
        try {
            const response = await fetch(API_CONFIG.baseURL + API_CONFIG.paths.family.join, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({
                    inviteCode: inviteCode
                })
            });

            const data = await response.json();
            
            if (data.code === 200) {
                return data;
            } else {
                throw new Error(data.msg || '加入家族失败');
            }
        } catch (error) {
            console.error('加入家族错误:', error);
            throw error;
        }
    }
}