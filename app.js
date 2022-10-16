require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
// import fs from 'fs';
// import pdf from 'pdf-parse';
var cors = require("cors");
const axios = require("axios");
// import { Request, Response } from 'express';
const jwtDecode = require("jwt-decode");
//import { TokenSet } from 'openid-client';
const {
  XeroAccessToken,
  XeroIdToken,
  XeroClient,
  Contact,
  LineItem,
  Invoice,
  Invoices,
  Phone,
  Contacts,
} = require("xero-node");

const session = require("express-session");

const path = require("path");
// const __dirname = path.resolve();

const urlencodedParser = bodyParser.urlencoded({ extended: false });

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirectUrl = process.env.REDIRECT_URI;
const scopes =
  "openid profile email accounting.settings accounting.reports.read accounting.journals.read accounting.contacts accounting.attachments accounting.transactions offline_access";

const ZAIO_DB_URL = "http://localhost:4000";

const xero = new XeroClient({
  clientId: client_id,
  clientSecret: client_secret,
  redirectUris: [redirectUrl],
  scopes: scopes.split(" "),
});

if (!client_id || !client_secret || !redirectUrl) {
  throw Error(
    "Environment Variables not all set - please check your .env file in the project root or create one!"
  );
}

const app = express();
app.use(express.static("public"));
app.use(express.json());

app.use(express.static(__dirname + "/build"));
app.use(cors());
app.use(
  session({
    secret: "something crazy",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.set("views", "./src/views");
app.set("view engine", "ejs");

const authenticationData = (req, res) => {
  return {
    decodedIdToken: req.session.decodedIdToken,
    decodedAccessToken: req.session.decodedAccessToken,
    tokenSet: req.session.tokenSet,
    allTenants: req.session.allTenants,
    activeTenant: req.session.activeTenant,
  };
};

app.get("/", (req, res) => {
  res.send(`<a href='/connect'>Connect to Xero</a>`);
});

app.get("/connect", async (req, res) => {
  try {
    const consentUrl = await xero.buildConsentUrl();
    res.redirect(consentUrl);
  } catch (err) {
    res.send("Sorry, something went wrong");
  }
});

app.get("/callback", async (req, res) => {
  try {
    const tokenSet = await xero.apiCallback(req.url);
    await xero.updateTenants();

    const decodedIdToken = jwtDecode(tokenSet.id_token);
    const decodedAccessToken = jwtDecode(tokenSet.access_token);

    req.session.decodedIdToken = decodedIdToken;
    req.session.decodedAccessToken = decodedAccessToken;
    req.session.tokenSet = tokenSet;
    req.session.allTenants = xero.tenants;
    // XeroClient is sorting tenants behind the scenes so that most recent / active connection is at index 0
    req.session.activeTenant = xero.tenants[0];

    const authData = authenticationData(req, res);

    res.redirect("/invoice");
  } catch (err) {
    res.send("Sorry, something went wrong");
  }
});

app.get("/organisation", async (req, res) => {
  try {
    const tokenSet = await xero.readTokenSet();
    const response = await xero.accountingApi.getOrganisations(
      req.session.activeTenant.tenantId
    );
    //res.send(`Hello, ${response.body.organisations[0].name}`);
    res.render("contact");
  } catch (err) {
    res.send("Sorry, something went wrong");
  }
});

app.post("/userInvoice", urlencodedParser, async (req, res) => {
  try {
    // ***********************************************find User

    console.log("form body", req.body.email);

    const response = await axios.post("http://localhost:4000/user", {
      email: req.body.email,
    });

    let contactID;

    const user = response.data.data;

    if (user.xeroContactId) {
      contactID = user.xeroContactId;
    } else {
      //  ********************************************create contact for user

      try {
        const contact = {
          name: user.username + "-" + user.email,
          firstName: user.username,
          emailAddress: user.email,
          phones: [
            {
              phoneNumber: user.phonenumber,
              phoneType: Phone.PhoneTypeEnum.MOBILE,
            },
          ],
        };
        const contacts = {
          contacts: [contact],
        };
        const response = await xero.accountingApi.createContacts(
          req.session.activeTenant.tenantId,
          contacts
        );
        contactID = response.body.contacts[0].contactID;
      } catch (err) {
        return res.json(err);
      }

      //  ****************************************************** add contactID to user

      try {
        const response2 = await axios.post(
          "http://localhost:4000/addXeroContactId",
          {
            email: user.email,
            contactID,
          }
        );
      } catch (err) {
        return res.json(err);
      }
    }

    // *****************************************************create Invoice for user

    const contact = {
      contactID: contactID,
    };

    // ************

    const lineItem = {
      description: req.body.description,
      quantity: req.body.quantity,
      unitAmount: req.body.unitPrice,
      accountCode: "000",
      taxType: "OUTPUT",
      taxAmount: req.body.quantity * req.body.unitPrice * 0.12,
      // tracking: lineItemTrackings
    };
    const lineItems = [];
    lineItems.push(lineItem);

    // ************

    // const lineItem: LineItem = {
    // 	accountID: accounts.body.accounts[0].accountID,
    // 	description: 'consulting',
    // 	quantity: 1.0,
    // 	unitAmount: 10.0
    // };

    const date = new Date();

    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();

    // This arrangement can be altered based on how we want the date's format to appear.
    let currentDate = `${year}-${month}-${day}`;

    console.log(currentDate);

    const invoice = {
      lineItems: [lineItem],
      contact: contact,
      dueDate: currentDate,
      date: currentDate,
      type: Invoice.TypeEnum.ACCREC,
    };
    const invoices = {
      invoices: [invoice],
    };
    const response3 = await xero.accountingApi.createInvoices(
      req.session.activeTenant.tenantId,
      invoices
    );
    console.log("invoices: ", response3.body.invoices);

    try {
      const response2 = await axios.post("http://localhost:4000/invoice", {
        ...response3.body.invoices[0],
        email: req.body.email,
      });
    } catch (err) {
      return res.json(err);
    }

    return res.json(response3.body);
  } catch (err) {
    return res.json(err);
  }
});

app.post("/api/createInvoice", urlencodedParser, async (req, res) => {
  try {
    const contact = {
      contactID: req.body.xeroContactId,
    };

    // ************
    const lineItem = {
      description: req.body.description,
      quantity: req.body.quantity,
      unitAmount: req.body.unitPrice,
      accountCode: "000",
      taxType: "OUTPUT",
      taxAmount: req.body.quantity * req.body.unitPrice * 0.12,
      // tracking: lineItemTrackings
    };
    const lineItems = [];
    lineItems.push(lineItem);

    // ************

    // const lineItem: LineItem = {
    // 	accountID: accounts.body.accounts[0].accountID,
    // 	description: 'consulting',
    // 	quantity: 1.0,
    // 	unitAmount: 10.0
    // };

    const date = new Date();

    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();

    // This arrangement can be altered based on how we want the date's format to appear.
    let currentDate = `${year}-${month}-${day}`;

    console.log(currentDate);

    const invoice = {
      lineItems: [lineItem],
      contact: contact,
      dueDate: currentDate,
      date: currentDate,
      type: Invoice.TypeEnum.ACCREC,
    };
    const invoices = {
      invoices: [invoice],
    };
    const response3 = await xero.accountingApi.createInvoices(
      req.session.activeTenant.tenantId,
      invoices
    );

    console.log("invoices: ", response3.body.invoices);
    return res.json(response3.body);
  } catch (err) {
    return res.json(err);
  }
});

app.post("/api/contact", urlencodedParser, async (req, res) => {
  try {
    const contact = {
      name: req.body.username + "-" + req.body.email,
      firstName: req.body.username,
      emailAddress: req.body.email,
      phones: [
        {
          phoneNumber: req.body.phonenumber,
          phoneType: Phone.PhoneTypeEnum.MOBILE,
        },
      ],
    };
    const contacts = {
      contacts: [contact],
    };
    const response = await xero.accountingApi.createContacts(
      req.session.activeTenant.tenantId,
      contacts
    );
    const contactID = response.body.contacts[0].contactID;
    return res.json(contactID);
  } catch (err) {
    return res.json(err);
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/client/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}
