import React from 'react';
import './Footer.css';


function Footer() {
  return <footer className="footer">
    <div className="footer-content">
      <p>&copy; {new Date().getFullYear()} Echo. All rights reserved.</p>
      <p>Made with ❤️ by Echo Team</p>
    </div>
  </footer>;
}

export default Footer;
