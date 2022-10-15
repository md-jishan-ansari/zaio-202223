import axios from "axios";

// const API_URL = process.env.REACT_APP_BACKEND_URL;
// const XERO_URL = process.env.REACT_APP_XERO_URL;
// const API_URL = "https://nameless-waters-24981.herokuapp.com";
const API_URL = "http://localhost:4000";
const XERO_URL = "";

const invoice = {
  userTutorAccount() {
    return axios
      .get(API_URL + "/usertutoraccount")
      .then((res) => {
        console.log(res.data, "res.data[0]");
        return res.data;
      })
      .catch((rej) => {
        return rej;
      });
  },

  createContact(userData) {
    return axios
      .get(XERO_URL + "/contact", {
        headers: { "Content-Type": "application/json" },
      })
      .then((res) => {
        console.log(res, "action res");
        return res.data;
      })
      .catch((rej) => {
        return rej;
      });
  },

  createInvoice(userData) {
    return axios
      .post("/createInvoice", userData)
      .then((res) => {
        console.log(res, "action res");
        return res.data;
      })
      .catch((rej) => {
        return rej;
      });
  },
};

export default invoice;
