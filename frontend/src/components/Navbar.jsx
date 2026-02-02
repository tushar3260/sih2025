import React from "react";



export const Navbar = () => {
    return (
              <header className={`fixed top-6 left-0 right-0 z-50 transition-all duration-300 px-4`}>
                 <div className={`max-w-5xl mx-auto rounded-full transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-xl shadow-xl border border-white/50 py-3 px-6' : 'bg-transparent py-4 px-0'}`}>
                    <div className="flex justify-between items-center">
                       
                       {/* Logo */}
                       <Link to="/" className="flex items-center gap-3 pl-2">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-800 to-emerald-600 flex items-center justify-center text-white shadow-lg border-2 border-white">
                             <Leaf size={18} fill="currentColor" />
                          </div>
                          <span className={`text-xl font-bold tracking-tight serif ${isScrolled ? 'text-gray-900' : 'text-gray-900'}`}>
                            Ayur<span className="text-emerald-700">Sutra</span>
                          </span>
                       </Link>
        
                       {/* Desktop Nav */}
                       <nav className="hidden md:flex items-center gap-1 bg-stone-200/50 p-1.5 rounded-full backdrop-blur-md border border-white/50">
                          {["Home", "Features", "Practitioners", "Services"].map(item => (
                             <a key={item} href={`#${item.toLowerCase()}`} className="px-5 py-2 rounded-full text-sm font-bold text-stone-700 hover:bg-white hover:text-emerald-800 hover:shadow-md transition-all">
                                {item}
                             </a>
                          ))}
                       </nav>
        
                       {/* Auth Button */}
                       <div className="flex items-center gap-3 pr-2">
                          <Link to={getDashboardRoute()} className="hidden md:flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-500/20">
                             {user ? "Dashboard" : "Login"} <ArrowRight size={16} />
                          </Link>
                          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md text-gray-800">
                            <Menu size={20}/>
                          </button>
                       </div>
                    </div>
                 </div>
              </header>
    )
  
}