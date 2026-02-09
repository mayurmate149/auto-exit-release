import { ToastContainer, toast, ToastOptions } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import React from "react";

export type ToasterProps = {
  position?: ToastOptions["position"];
  autoClose?: ToastOptions["autoClose"];
  hideProgressBar?: ToastOptions["hideProgressBar"];
  newestOnTop?: boolean;
  closeOnClick?: boolean;
  rtl?: boolean;
  pauseOnFocusLoss?: boolean;
  draggable?: boolean;
  pauseOnHover?: boolean;
  theme?: "light" | "dark" | "colored" | "auto";
};

/**
 * Reusable Toaster component for react-toastify notifications.
 * Place <Toaster /> once in your app root or main component.
 * Configure position, autoClose, theme, etc. as needed.
 */
export const Toaster: React.FC<ToasterProps> = ({
  position = "top-right",
  autoClose = 6000,
  hideProgressBar = false,
  newestOnTop = false,
  closeOnClick = true,
  rtl = false,
  pauseOnFocusLoss = true,
  draggable = true,
  pauseOnHover = true,
  theme = "light",
}) => (
  <ToastContainer
    position={position}
    autoClose={autoClose}
    hideProgressBar={hideProgressBar}
    newestOnTop={newestOnTop}
    closeOnClick={closeOnClick}
    rtl={rtl}
    pauseOnFocusLoss={pauseOnFocusLoss}
    draggable={draggable}
    pauseOnHover={pauseOnHover}
    theme={theme}
    className="z-9999! mt-16"
    toastClassName="!mt-2"
  />
);

/**
 * Call showToast(message, options) to show a toast from anywhere.
 */
export const showToast = (message: string, options?: ToastOptions) => {
  toast(message, options);
};
