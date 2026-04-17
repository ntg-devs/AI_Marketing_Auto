
import { useUIStore } from '@/store/useUIStore';

export const translations = {
  vi: {
    settings: {
      title: 'Cấu hình Hệ thống',
      subtitle: 'Quản lý Workspace & Brand Identity',
      tabs: {
        connections: 'Kết nối',
        workspace: 'Workspace',
        app: 'Thiết lập',
      },
      app: {
        theme: 'Chế độ giao diện',
        theme_desc: 'Sử dụng tối hoặc sáng',
        language: 'Ngôn ngữ hệ thống',
        language_desc: 'Tiếng Việt mặc định',
        notifications: 'Thông báo đẩy',
        notifications_desc: 'Cập nhật tiến trình đăng bài',
      },
      save_all: 'Lưu tất cả thay đổi',
    },
    account_team: {
      title: 'Tài khoản & Nhóm',
      subtitle: 'Quản lý thực thể & Bảo mật',
      tabs: {
        profile: 'Hồ sơ',
        security: 'Bảo mật',
        team: 'Đội ngũ',
      },
      profile: {
        full_name: 'Họ và tên',
        email: 'Địa chỉ Email',
        role: 'Vai trò & Quyền',
        save: 'Lưu thay đổi',
        logout: 'Đăng xuất',
      },
      security: {
        jwt_title: 'Mã JWT Token',
        expiry: 'Hết hạn sau',
        refresh: 'Làm mới',
        two_fa: 'Xác thực 2 lớp',
        two_fa_desc: 'TOTP qua ứng dụng Authenticator',
        sessions: 'Phiên hoạt động',
        revoke_all: 'Đăng xuất tất cả',
      }
    },
    notifications: {
      title: 'Trung tâm thông báo',
      subtitle: 'Trạng thái vận hành thời gian thực',
      tabs: {
        jobs: 'Công việc',
        health: 'Sức khỏe',
      },
      mark_all: 'Đánh dấu tất cả đã đọc',
      count: 'thông báo',
      health: {
        usage_title: 'Sử dụng & Chi phí',
        tokens: 'Token đã dùng',
        cost: 'Chi phí ước tính',
        service_status: 'Trạng thái dịch vụ',
        latency: 'Độ trễ',
        uptime: 'Hoạt động',
      }
    },
    smart_entry: {
      title: 'Nhập Liệu Thông Minh',
      subtitle: 'Nguồn & Ngữ cảnh',
      ai_engines: 'Động cơ AI',
      jobs: 'Tác vụ',
      web_link: 'Liên kết Web',
      keywords: 'Từ khóa',
      file: 'Tệp tin',
      analyze: 'Phân tích',
      combined_research: 'Nghiên cứu Kết hợp (Web + Ảnh)',
      key_insights: 'Thông tin Chuyên sâu',
      summarize_btn: 'AI Tóm tắt',
      generate_btn: 'Tạo nội dung',
      save_kb: 'Lưu vào KB',
    },
    common: {
      refresh: 'Làm mới',
      save: 'Lưu',
      cancel: 'Hủy',
      delete: 'Xóa',
      online: 'Trực tuyến',
      offline: 'Ngoại tuyến',
    }
  },
  en: {
    settings: {
      title: 'System Settings',
      subtitle: 'Manage Workspace & Brand Identity',
      tabs: {
        connections: 'Connections',
        workspace: 'Workspace',
        app: 'App',
      },
      app: {
        theme: 'Interface Theme',
        theme_desc: 'Toggle dark or light mode',
        language: 'System Language',
        language_desc: 'English enabled',
        notifications: 'Push Notifications',
        notifications_desc: 'Updates on posting progress',
      },
      save_all: 'Save All Changes',
    },
    account_team: {
      title: 'Account & Team',
      subtitle: 'Entity Management & Security',
      tabs: {
        profile: 'Profile',
        security: 'Security',
        team: 'Team',
      },
      profile: {
        full_name: 'Full Name',
        email: 'Email Address',
        role: 'Role & Permissions',
        save: 'Save Changes',
        logout: 'Log out',
      },
      security: {
        jwt_title: 'JWT Token',
        expiry: 'Expires in',
        refresh: 'Refresh',
        two_fa: 'Two-Factor Authentication',
        two_fa_desc: 'TOTP via Authenticator app',
        sessions: 'Active Sessions',
        revoke_all: 'Revoke All',
      }
    },
    notifications: {
      title: 'Notification Center',
      subtitle: 'Real-time Operations Status',
      tabs: {
        jobs: 'Jobs',
        health: 'Health',
      },
      mark_all: 'Mark all as read',
      count: 'notifications',
      health: {
        usage_title: 'Usage & Cost',
        tokens: 'Tokens Used',
        cost: 'Est. Cost',
        service_status: 'Service Status',
        latency: 'Latency',
        uptime: 'Uptime',
      }
    },
    smart_entry: {
      title: 'Smart Entry',
      subtitle: 'Input & Context',
      ai_engines: 'AI Engines',
      jobs: 'Jobs',
      web_link: 'Web Link',
      keywords: 'Keywords',
      file: 'File',
      analyze: 'Analyze',
      combined_research: 'Combined Research (Web + Image)',
      key_insights: 'Key Insights',
      summarize_btn: 'AI Summarize',
      generate_btn: 'Generate Content',
      save_kb: 'Save to KB',
    },
    common: {
      refresh: 'Refresh',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      online: 'Online',
      offline: 'Offline',
    }
  }
};

export type TranslationKeys = typeof translations.vi;

export const useTranslation = () => {
  const language = useUIStore((state) => state.language);
  const t = (path: string): string => {
    const keys = path.split('.');
    let current: any = translations[language];
    
    for (const key of keys) {
      if (current[key] === undefined) {
        return path; // Fallback to path if not found
      }
      current = current[key];
    }
    
    return current as string;
  };

  return { t, language };
};
