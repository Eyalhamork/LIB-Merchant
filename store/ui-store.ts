// store/ui-store.ts
import { create } from 'zustand';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface UIState {
  // Toast state
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Loading states
  isLoading: Record<string, boolean>;
  setLoading: (key: string, isLoading: boolean) => void;
  getLoading: (key: string) => boolean;

  // Modal states
  modals: Record<string, boolean>;
  openModal: (key: string) => void;
  closeModal: (key: string) => void;
  toggleModal: (key: string) => void;
  isModalOpen: (key: string) => boolean;

  // Confirmation dialog
  confirmDialog: {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm?: () => void;
  };
  showConfirmDialog: (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: {
      confirmText?: string;
      cancelText?: string;
      variant?: 'danger' | 'warning' | 'info';
    }
  ) => void;
  hideConfirmDialog: () => void;

  // Image preview
  imagePreview: {
    isOpen: boolean;
    imageUrl: string;
    title?: string;
    alt?: string;
  };
  showImagePreview: (imageUrl: string, title?: string, alt?: string) => void;
  hideImagePreview: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  // Toast state
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto-remove toast after duration (default 5 seconds)
    const duration = toast.duration || 5000;
    setTimeout(() => {
      get().removeToast(id);
    }, duration);
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
  clearToasts: () => {
    set({ toasts: [] });
  },

  // Loading states
  isLoading: {},
  setLoading: (key, isLoading) => {
    set((state) => ({
      isLoading: {
        ...state.isLoading,
        [key]: isLoading,
      },
    }));
  },
  getLoading: (key) => {
    return get().isLoading[key] || false;
  },

  // Modal states
  modals: {},
  openModal: (key) => {
    set((state) => ({
      modals: {
        ...state.modals,
        [key]: true,
      },
    }));
  },
  closeModal: (key) => {
    set((state) => ({
      modals: {
        ...state.modals,
        [key]: false,
      },
    }));
  },
  toggleModal: (key) => {
    set((state) => ({
      modals: {
        ...state.modals,
        [key]: !state.modals[key],
      },
    }));
  },
  isModalOpen: (key) => {
    return get().modals[key] || false;
  },

  // Confirmation dialog
  confirmDialog: {
    isOpen: false,
    title: '',
    message: '',
  },
  showConfirmDialog: (title, message, onConfirm, options = {}) => {
    set({
      confirmDialog: {
        isOpen: true,
        title,
        message,
        onConfirm,
        confirmText: options.confirmText,
        cancelText: options.cancelText,
        variant: options.variant,
      },
    });
  },
  hideConfirmDialog: () => {
    set({
      confirmDialog: {
        isOpen: false,
        title: '',
        message: '',
      },
    });
  },

  // Image preview
  imagePreview: {
    isOpen: false,
    imageUrl: '',
  },
  showImagePreview: (imageUrl, title, alt) => {
    set({
      imagePreview: {
        isOpen: true,
        imageUrl,
        title,
        alt,
      },
    });
  },
  hideImagePreview: () => {
    set({
      imagePreview: {
        isOpen: false,
        imageUrl: '',
      },
    });
  },
}));

// Helper hooks for common patterns
export const useToast = () => {
  const addToast = useUIStore((state) => state.addToast);

  return {
    success: (message: string, duration?: number) =>
      addToast({ type: 'success', message, duration }),
    error: (message: string, duration?: number) =>
      addToast({ type: 'error', message, duration }),
    warning: (message: string, duration?: number) =>
      addToast({ type: 'warning', message, duration }),
    info: (message: string, duration?: number) =>
      addToast({ type: 'info', message, duration }),
  };
};

export const useLoading = (key: string) => {
  const setLoading = useUIStore((state) => state.setLoading);
  const isLoading = useUIStore((state) => state.getLoading(key));

  return {
    isLoading,
    setLoading: (loading: boolean) => setLoading(key, loading),
  };
};

export const useModal = (key: string) => {
  const openModal = useUIStore((state) => state.openModal);
  const closeModal = useUIStore((state) => state.closeModal);
  const toggleModal = useUIStore((state) => state.toggleModal);
  const isOpen = useUIStore((state) => state.isModalOpen(key));

  return {
    isOpen,
    open: () => openModal(key),
    close: () => closeModal(key),
    toggle: () => toggleModal(key),
  };
};
