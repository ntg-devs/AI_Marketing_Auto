
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
    },
    smart_scheduler: {
      title: 'Lịch đăng bài',
      tabs: {
        single: 'Một nền tảng',
        all: 'Tất cả nền tảng',
      },
      form: {
        post_title: 'Tiêu đề bài đăng',
        post_title_placeholder_single: 'VD: AI Marketing Guide',
        post_title_placeholder_all: 'VD: Chiến dịch AI Marketing...',
        platform: 'Nền tảng',
        date: 'Ngày',
        time: 'Giờ',
        select_date: 'Ngày đăng',
        select_platform_time: 'Chọn nền tảng & giờ đăng',
        content_exists: 'Đã có',
        content_empty: 'Trống',
      },
      actions: {
        cancel: 'Hủy',
        schedule: 'Lên lịch',
        scheduling: 'Đang lên lịch...',
        schedule_all: 'Lên lịch {{count}} nền tảng',
      },
      status: {
        scheduled: 'Đã lên lịch',
        processing: 'Đang xử lý',
        published: 'Đã đăng',
        failed: 'Thất bại',
        cancelled: 'Đã hủy',
        overdue: 'Quá hạn',
      },
      job_card: {
        today: 'Hôm nay',
        publish_now: 'Đăng ngay',
        retry: 'Thử lại',
        view_content: 'Xem nội dung',
        delete: 'Xóa',
        delete_success: 'Đã xóa lịch đăng bài',
        delete_failed: 'Xóa thất bại',
      },
      messages: {
        enter_title: 'Vui lòng nhập tiêu đề bài đăng',
        future_time: 'Thời gian phải nằm trong tương lai',
        select_platform: 'Vui lòng chọn ít nhất 1 nền tảng',
        schedule_success: 'Đã lên lịch "{{title}}" cho {{platform}}',
        schedule_all_success: 'Đã lên lịch {{success}}/{{total}} nền tảng thành công',
        schedule_failed: 'Lên lịch thất bại',
        update_time_success: 'Đã cập nhật thời gian đăng bài',
        update_time_failed: 'Không thể cập nhật thời gian',
      },
      header: {
        title: 'Lịch đăng bài',
        subtitle: 'Tự động phân phối nội dung đa nền tảng',
      },
      overview: {
        title: 'Tổng quan tuần',
        this_week: 'Tuần này',
        week_offset: 'Tuần {{offset}}',
      },
      filter: {
        all: 'Tất cả',
      },
      queue: {
        title: 'Hàng đợi',
        empty_title: 'Chưa có lịch đăng bài nào',
        empty_desc: 'Tự động hoá phân phối bài viết thông minh từ Live Research',
      },
      cta: {
        publish_all_overdue: 'Đăng tất cả quá hạn ({{count}})',
        publish_all_success: 'Đã xử lý {{count}} bài đăng thành công!',
        publish_all_failed: 'Đăng bài thất bại, vui lòng thử lại',
      },
      footer: {
        all_scheduled_title: 'Tất cả đã lên lịch',
        all_scheduled_desc: '{{count}} bài sẽ được tự động đăng theo lịch',
      }
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
    },
    smart_scheduler: {
      title: 'Post Schedule',
      tabs: {
        single: 'Single Platform',
        all: 'All Platforms',
      },
      form: {
        post_title: 'Post Title',
        post_title_placeholder_single: 'e.g. AI Marketing Guide',
        post_title_placeholder_all: 'e.g. AI Marketing Campaign...',
        platform: 'Platform',
        date: 'Date',
        time: 'Time',
        select_date: 'Posting Date',
        select_platform_time: 'Select Platform & Time',
        content_exists: 'Available',
        content_empty: 'Empty',
      },
      actions: {
        cancel: 'Cancel',
        schedule: 'Schedule',
        scheduling: 'Scheduling...',
        schedule_all: 'Schedule {{count}} platforms',
      },
      status: {
        scheduled: 'Scheduled',
        processing: 'Processing',
        published: 'Published',
        failed: 'Failed',
        cancelled: 'Cancelled',
        overdue: 'Overdue',
      },
      job_card: {
        today: 'Today',
        publish_now: 'Publish Now',
        retry: 'Retry',
        view_content: 'View Content',
        delete: 'Delete',
        delete_success: 'Post schedule deleted',
        delete_failed: 'Delete failed',
      },
      messages: {
        enter_title: 'Please enter post title',
        future_time: 'Time must be in the future',
        select_platform: 'Please select at least one platform',
        schedule_success: 'Scheduled "{{title}}" for {{platform}}',
        schedule_all_success: 'Scheduled {{success}}/{{total}} platforms successfully',
        schedule_failed: 'Scheduling failed',
        update_time_success: 'Posting time updated',
        update_time_failed: 'Unable to update time',
      },
      header: {
        title: 'Post Schedule',
        subtitle: 'Automated multi-platform content distribution',
      },
      overview: {
        title: 'Weekly Overview',
        this_week: 'This week',
        week_offset: 'Week {{offset}}',
      },
      filter: {
        all: 'All',
      },
      queue: {
        title: 'Queue',
        empty_title: 'No scheduled posts yet',
        empty_desc: 'Intelligent content distribution automation from Live Research',
      },
      cta: {
        publish_all_overdue: 'Publish all overdue ({{count}})',
        publish_all_success: 'Processed {{count}} posts successfully!',
        publish_all_failed: 'Publishing failed, please try again',
      },
      footer: {
        all_scheduled_title: 'All scheduled',
        all_scheduled_desc: '{{count}} posts will be automatically published as scheduled',
      }
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
