import React from 'react';

const Header = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm mb-4">
        <div className="container">
            <a className="navbar-brand d-flex align-items-center" href="/">
                <i className="bi bi-shield-check me-2"></i> 
                <strong>User Management <span className="text-info">By Ini-Obong Obot</span></strong>
            </a>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span className="navbar-toggler-icon"></span>
            </button>
        </div>
    </nav>
  );
};

export default Header;