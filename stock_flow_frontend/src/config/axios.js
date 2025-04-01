import axios from "axios";
import Cookies from "js-cookie";

const BASE_URL = import.meta.env.VITE_BASEURL;
const FRONTEND_BASEURL = import.meta.env.VITE_FRONTEND_BASEURL;
const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,  
    headers: {
        "Content-Type": "application/json",
        // 'Referer':FRONTEND_BASEURL
    },
});

api.interceptors.request.use(config => {
   
    try{
         let csrfToken = Cookies.get("csrftoken");
    console.log('19csrf token from cookies==========',csrfToken)
    
    if (csrfToken) {
        console.log(csrfToken,'.........')
        config.headers["X-CSRFToken"] = csrfToken;
        config.headers["X-Requested-With"] = "XMLHttpRequest";
    } else {
        console.warn("35No CSRF token available");
    }
    
    return config;
    }
    catch(e){
        console.error('e=====',e)
    }
    
}, error => Promise.reject(error));

export default api;
export { BASE_URL };