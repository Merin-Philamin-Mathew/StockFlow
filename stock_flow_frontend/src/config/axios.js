import axios from "axios";
import Cookies from "js-cookie";

const BASE_URL = import.meta.env.VITE_BASEURL;
const FRONTEND_BASEURL = import.meta.env.VITE_FRONTEND_BASEURL;

// Create axios instance with proper configuration
const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,  
    headers: {
        "Content-Type": "application/json",
        'Referer':FRONTEND_BASEURL
    },
});

api.interceptors.request.use(config => {
    let csrfToken = Cookies.get("csrftoken");
    console.log('========csrf token from cookies==========',csrfToken)
    const cookies = document.cookie.split('; ')
    const csrfCookie = cookies.find(row => row.startsWith('csrftoken=')).split('=')[1]
    console.log('cookies = ',csrfCookie)
    
    if (!csrfCookie) {
        csrfCookie = localStorage.getItem("csrftoken");
        console.log('========csrf token from local_sto==========',csrfToken)
    }
    
    if (csrfCookie) {
        console.log(csrfToken,'000000000')
        config.headers["X-CSRFToken"] = csrfCookie;
        config.headers["X-Requested-With"] = "XMLHttpRequest";
    } else {
        console.warn("No CSRF token available");
    }
    
    return config;
}, error => Promise.reject(error));

export default api;
export { BASE_URL };