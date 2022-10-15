import React from "react";
import { useHistory } from "react-router-dom";

// const API_URL = "http://localhost:4000";

const Main = () => {
  const history = useHistory();

  return (
    <>
      <h2>Xero Invoice Creation</h2>
      <a className="btn btn-primary" href="/connect">
        Connect
      </a>
      <button
        className="btn btn-danger ml-3"
        onClick={() => history.push("/invoice")}
      >
        Create Invoice
      </button>
    </>
  );
};

export default Main;
