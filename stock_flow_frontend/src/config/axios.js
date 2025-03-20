import axios from "axios";
import Cookies from "js-cookie"; 


const BASE_URL = import.meta.env.VITE_BASEURL;

// USER API
const csrfToken = Cookies.get('csrftoken'); // Django's default CSRF cookie name is 'csrftoken'

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        "X-CSRFToken": csrfToken,
    },
});


export default api
export {BASE_URL}