// API配置文件
const API_CONFIG = {
    // 后端服务基础URL
    baseURL: 'https://life-imprint-backend-production-8032.up.railway.app',
    
    // API路径
    paths: {
        // 用户相关
        user: {
            register: '/api/user/register',
            login: '/api/user/login',
            update: '/api/user/update',
            get: '/api/user/get'
        },
        
        // 家族相关
        family: {
            create: '/api/family/create',
            join: '/api/family/join',
            list: '/api/family/list',
            memberList: '/api/family/member/list',
            myListInfo: '/api/family/my/list/info',
            statistics: '/api/family/statistics'
        },
        
        // 族谱相关
        genealogy: {
            addRoot: '/api/genealogy/root/add',
            addSpouse: '/api/genealogy/node/spouse/add',
            addChild: '/api/genealogy/node/child/add',
            deleteNode: '/api/genealogy/node/delete',
            updateName: '/api/genealogy/node/name/update',
            queryTree: '/api/genealogy/tree/query'
        },
        
        // 成员详情相关
        member: {
            detail: '/api/member/detail/query',
            update: '/api/member/detail/update',
            uploadAvatar: '/api/member/avatar/upload',
            uploadMedia: '/api/member/multimedia/upload',
            deleteMedia: '/api/member/multimedia/delete',
            updateMedia: '/api/member/multimedia/update'
        },
        
        // 事件相关
        event: {
            add: '/api/event/add',
            update: '/api/event/update',
            delete: '/api/event/delete',
            list: '/api/event/list'
        },
        
        // AI相关
        ai: {
            polish: '/api/ai/polish'
        }
    }
};

// 通用请求头
export const getCommonHeaders = () => {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json'
    };
    
    // 如果有token，添加Authorization头
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
};

// 通用带家族ID的请求头
export const getHeadersWithFamilyId = (familyId) => {
    return {
        ...getCommonHeaders(),
        'family-id': familyId
    };
};

// 通用fetch请求方法
export const apiRequest = async (url, options = {}) => {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...getCommonHeaders(),
                ...options.headers
            }
        });
        
        // 检查HTTP状态码
        if (!response.ok) {
            throw new Error(`HTTP错误 ${response.status}`);
        }
        
        const data = await response.json();
        
        // 检查响应状态
        if (data.code === 401) {
            // Token无效或过期，清除本地存储并重定向到登录页
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
            return null;
        }
        
        return data;
    } catch (error) {
        console.error('API请求错误:', error);
        return { code: 500, msg: '网络请求失败，请稍后重试' };
    }
};

// 族谱相关API调用函数
export const genealogyAPI = {
    // 查询族谱结构
    queryTree: async (familyId, showDelete = 0) => {
        // 🔴 核心修改：在URL中添加familyId参数，确保后端能正确获取家族ID
        const url = `${API_CONFIG.baseURL}${API_CONFIG.paths.genealogy.queryTree}?showDelete=${showDelete}&familyId=${familyId}`;
        return await apiRequest(url, {
            method: 'GET',
            headers: getHeadersWithFamilyId(familyId)
        });
    },
    
    // 新增/编辑根节点
    addOrUpdateRoot: async (familyId, data) => {
        const url = `${API_CONFIG.baseURL}${API_CONFIG.paths.genealogy.addRoot}`;
        return await apiRequest(url, {
            method: 'POST',
            headers: getHeadersWithFamilyId(familyId),
            body: JSON.stringify(data)
        });
    },
    
    // 新增/编辑配偶
    addOrUpdateSpouse: async (familyId, data) => {
        const url = `${API_CONFIG.baseURL}${API_CONFIG.paths.genealogy.addSpouse}`;
        return await apiRequest(url, {
            method: 'POST',
            headers: getHeadersWithFamilyId(familyId),
            body: JSON.stringify(data)
        });
    },
    
    // 新增/编辑子女
    addOrUpdateChild: async (familyId, data) => {
        const url = `${API_CONFIG.baseURL}${API_CONFIG.paths.genealogy.addChild}`;
        return await apiRequest(url, {
            method: 'POST',
            headers: getHeadersWithFamilyId(familyId),
            body: JSON.stringify(data)
        });
    },
    
    // 删除节点
    deleteNode: async (familyId, nodeId) => {
        const url = `${API_CONFIG.baseURL}${API_CONFIG.paths.genealogy.deleteNode}?nodeId=${nodeId}`;
        return await apiRequest(url, {
            method: 'DELETE',
            headers: getHeadersWithFamilyId(familyId)
        });
    },
    
    // 查询单个节点详情
    queryNodeById: async (familyId, nodeId) => {
        const url = `${API_CONFIG.baseURL}/api/genealogy/node/query/one?nodeId=${nodeId}`;
        return await apiRequest(url, {
            method: 'GET',
            headers: getHeadersWithFamilyId(familyId)
        });
    }
};

export default API_CONFIG;