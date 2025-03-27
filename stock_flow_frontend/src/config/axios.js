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
   
    try{
         // let csrfToken = Cookies.get("csrftoken");
    // console.log('19csrf token from cookies==========',csrfToken)
    // console.log('19csrf token from cookies==========',csrfToken)
        const cookies = document.cookie.split('; ')
    const csrfCookie = cookies.find(row => row.startsWith('csrftoken=')).split('=')[1]
    console.log('23cookies = ',csrfCookie)
    
    if (!csrfCookie) {
        csrfCookie = localStorage.getItem("csrftoken");
        console.log('27========csrf token from local_sto==========',csrfToken)
    }
    
    if (csrfCookie) {
        console.log(csrfToken,'.........')
        config.headers["X-CSRFToken"] = csrfCookie;
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