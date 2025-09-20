import { Mail, ExternalLink } from "lucide-react";
import Link from "next/link";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { name: "About Us", path: "/about" },
      // { name: "Our Services", path: "/services" },
      { name: "Contact", path: "/contact" },
    ],
    important: [
      { name: "Login", path: "/login" },
      { name: "Register", path: "/register" },
      // { name: "FAQ", path: "/faq" },
    ],
    legal: [
      { name: "Privacy Policy", path: "/privacy" },
      { name: "Terms of Service", path: "/terms" },
      { name: "Security", path: "/security" },
    ]
  };

  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand section */}
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <span className="text-sm font-bold">A</span>
                </div>
                <span className="text-xl font-bold font-display">Anytimetrade</span>
              </div>
              <p className="text-background/80 mb-4 leading-relaxed">
                Get competitive & affordable investment advice - anytimetrade.net
              </p>
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="h-4 w-4 text-primary" />
                <a 
                  href="mailto:anytimetrade555@gmail.com"
                  className="text-background/80 hover:text-primary transition-colors"
                >
                  anytimetrade555@gmail.com
                </a>
              </div>
            </div>

            {/* Company links */}
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.path}
                      className="text-background/80 hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Important links */}
            <div>
              <h3 className="font-semibold mb-4">Important Links</h3>
              <ul className="space-y-2">
                {footerLinks.important.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.path}
                      className="text-background/80 hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal links */}
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.path}
                      className="text-background/80 hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-background/20 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-background/80">
              © {currentYear} anytimetrade.net All Rights Reserved
            </div>
            
            <div className="flex items-center space-x-6 text-sm">
              <span className="text-background/80">Made with care for your success</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-success"></div>
                <span className="text-background/80">Secure & Trusted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;