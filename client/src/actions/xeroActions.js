import axios from "axios";

// const API_URL = process.env.REACT_APP_BACKEND_URL;
// const XERO_URL = process.env.REACT_APP_XERO_URL;
// const API_URL = "https://nameless-waters-24981.herokuapp.com";
const API_URL = "http://localhost:4000";
const XERO_URL = "";

const invoice = {
  getUser(email) {
    return axios
      .post(API_URL + "/user", { email: email })
      .then((res) => {
        console.log(res.data, "res.data[0]");
        return res.data;
      })
      .catch((rej) => {
        return rej;
      });
  },

  addXeroContactId(userData) {
    return axios
      .post(API_URL + "/addXeroContactId", {
        email: userData.email,
        contactID: userData.xeroContactId,
      })
      .then((res) => {
        console.log(res.data, "res.data[0]");
        return res.data;
      })
      .catch((rej) => {
        return rej;
      });
  },

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
    console.log(userData, "createContact");
    return axios
      .post("api/contact", userData)
      .then((res) => {
        return res.data;
      })
      .catch((rej) => {
        return rej;
      });
  },

  createInvoice(userData) {
    console.log(userData, "for createInvoice");
    return axios
      .post("api/createInvoice", userData)
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
