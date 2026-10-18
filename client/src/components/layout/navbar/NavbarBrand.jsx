import React from 'react';
import { Link } from 'react-router-dom';

const NavbarBrand = () => {
  return (
    <Link to="/" className="flex flex-col items-start select-none">
      <span className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-[#1b3b2b]">
        KIDS<span className="text-amber-600">&</span>FAMILY
      </span>
      <span className="text-[9px] sm:text-[10px] tracking-widest text-neutral-500 uppercase -mt-0.5 sm:-mt-1 font-semibold hidden xs:block">
        Quality • Comfort • Love
      </span>
    </Link>
  );
};

export default NavbarBrand;
