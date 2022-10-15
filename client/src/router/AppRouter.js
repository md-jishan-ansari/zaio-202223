import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import Details from '../components/Details';
import Invoice from '../components/Invoice';
import Main from '../components/Main';
import UserForm from '../components/UserForm';

const AppRouter = () => (
  <BrowserRouter>
    <div className="container">
      <Switch>
        <Route component={Main} path="/" exact={true} />
        <Route component={UserForm} path="/contact" />
        <Route component={Invoice} path="/invoice" />
      </Switch>
    </div>
  </BrowserRouter>
);

export default AppRouter;
