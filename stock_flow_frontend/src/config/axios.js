import axios from "axios";
import Cookies from "js-cookie";

const BASE_URL = import.meta.env.VITE_BASEURL;

// Create axios instance with proper configuration
const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,  
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(config => {
    let csrfToken = Cookies.get("csrftoken");
    
    if (!csrfToken) {
        csrfToken = localStorage.getItem("csrftoken");
    }
    
    if (csrfToken) {
        config.headers["X-CSRFToken"] = csrfToken;
        config.headers["X-Requested-With"] = "XMLHttpRequest";
    } else {
        console.warn("No CSRF token available");
    }
    
    return config;
}, error => Promise.reject(error));

export default api;
export { BASE_URL };