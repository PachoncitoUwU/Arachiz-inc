import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Fingerprint, ScanFace, QrCode, ShieldCheck } from 'lucide-react';
import { useWorldCup } from '../context/WorldCupContext';

export default function Landing() {
  const { worldCupMode } = useWorldCup();
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  const floatVariants = {
    animate: {
      y: [0, -15, 0],
      transition: { duration: 6, repeat: Infinity, ease: "easeInOut" }
    }
  };

  return (
    <div className="h-screen bg-[#F5F5F5] dark:bg-zinc-950 relative overflow-hidden flex flex-col font-sans transition-colors duration-500">
      
      {/* Botón Sobre Nosotros - Esquina Superior Derecha */}
      <div className="absolute top-3 right-3 md:top-4 md:right-4 z-50">
        <Link 
          to="/about" 
          className="px-3 py-1.5 md:px-4 md:py-2 bg-white dark:bg-zinc-800 text-gray-800 dark:text-white rounded-lg font-semibold text-xs hover:shadow-lg hover:scale-105 transition-all active:scale-95 border border-gray-300 dark:border-zinc-600 flex items-center gap-2"
        >
          Sobre Nosotros
        </Link>
      </div>

      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.05, 1], rotate: [0, 5, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[500px] h-[500px] rounded-full bg-blue-200/40 dark:bg-blue-900/20 blur-[80px]"
        />
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[20%] -right-[10%] w-[400px] h-[400px] rounded-full bg-green-200/40 dark:bg-green-900/20 blur-[80px]"
        />
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-between max-w-7xl mx-auto w-full px-4 md:px-6 lg:px-12 py-6 md:py-8 lg:py-12">
        
        {/* Left Content */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex-1 w-full max-w-2xl text-center lg:text-left space-y-4 md:space-y-6 z-20 mb-8 lg:mb-0"
        >
          {/* Logo Section */}
          <motion.div variants={itemVariants} className="flex items-center justify-center lg:justify-start gap-3 mb-4">
             <img 
               src={worldCupMode ? "/Arachiz-worldcup.png" : "/ArachizLogoPNG.png"} 
               alt="Arachiz Logo" 
               className="h-12 md:h-16 object-contain dark:invert transition-all duration-300" 
             />
          </motion.div>

          {/* Titles */}
          <motion.div variants={itemVariants} className="space-y-2 md:space-y-3">
            <h1 className="text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-gray-900 dark:text-white leading-[1.1] tracking-tight">
              MÉTODOS DE <br className="hidden md:block" />
              <span className="text-[#4285F4]">ASISTENCIA</span>
            </h1>
          </motion.div>
          
          <motion.p variants={itemVariants} className="text-gray-600 dark:text-gray-400 text-sm md:text-base lg:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Plataforma integral para el control y registro de asistencia. Accede a tu cuenta para gestionar fichas, horarios y justificaciones de manera eficiente y segura.
          </motion.p>
          
          {/* Buttons */}
          <motion.div variants={itemVariants} className="pt-4 md:pt-6 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
            <Link 
              to="/register" 
              className="w-full sm:w-auto px-6 md:px-8 py-2.5 md:py-3 bg-[#34A853] text-white rounded-xl font-semibold text-sm md:text-base hover:bg-green-600 transition-all active:scale-95 shadow-lg shadow-green-500/30 flex justify-center items-center"
            >
              Registrarse
            </Link>
            <Link 
              to="/login" 
              className="w-full sm:w-auto px-6 md:px-8 py-2.5 md:py-3 bg-[#4285F4] text-white rounded-xl font-semibold text-sm md:text-base hover:bg-[#3367d6] transition-all active:scale-95 shadow-lg shadow-blue-500/30 flex justify-center items-center"
            >
              Iniciar Sesión
            </Link>
          </motion.div>
        </motion.div>

        {/* Right Content - Mockup Device (Responsive & Themed) */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="flex-1 w-full flex justify-center items-center relative h-[280px] sm:h-[350px] md:h-[400px] lg:h-[500px] z-10"
        >
           {/* Center Mockup */}
           <motion.div 
             variants={floatVariants}
             animate="animate"
             className="relative z-20 w-[180px] sm:w-[220px] md:w-[280px] h-[250px] sm:h-[320px] md:h-[420px] bg-white dark:bg-zinc-800 rounded-[25px] sm:rounded-[30px] md:rounded-[40px] shadow-2xl border-4 sm:border-6 md:border-8 border-gray-100 dark:border-zinc-700 flex flex-col items-center justify-center transform rotate-6 hover:rotate-3 transition-transform duration-500"
           >
              <div className="absolute inset-1 sm:inset-2 bg-[#F8FAFC] dark:bg-zinc-900 rounded-[18px] sm:rounded-[22px] md:rounded-[30px] shadow-inner flex flex-col items-center justify-center p-3 sm:p-4 md:p-5 overflow-hidden border border-gray-200 dark:border-zinc-800 transition-colors duration-500">
                <div className="w-14 sm:w-20 md:w-28 h-16 sm:h-24 md:h-32 rounded-xl sm:rounded-2xl md:rounded-3xl flex items-center justify-center opacity-80 mb-3 sm:mb-4 md:mb-5 bg-white dark:bg-zinc-800 shadow-md transition-colors duration-500">
                   <Fingerprint strokeWidth={1.5} className="text-[#4285F4] drop-shadow-sm w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20" />
                </div>
                <div className="mt-auto w-full h-7 sm:h-9 md:h-11 bg-gray-100 dark:bg-zinc-800 rounded-lg sm:rounded-xl flex items-center px-2 sm:px-3 md:px-4 shadow-sm border border-gray-200 dark:border-zinc-700 transition-colors duration-500">
                   <span className="text-[9px] sm:text-[10px] md:text-xs text-gray-400 dark:text-gray-500 font-medium">Reconocimiento...</span>
                </div>
              </div>
           </motion.div>
           
           {/* Floating Element 1: Face ID Card */}
           <motion.div 
             animate={{ y: [0, 20, 0] }}
             transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
             className="hidden sm:block absolute top-[5%] md:top-[8%] left-[0%] md:left-[3%] z-30 w-28 md:w-36 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-2.5 md:p-3 transform -rotate-[12deg] border border-gray-100 dark:border-zinc-700 transition-colors duration-500"
           >
              <div className="w-full h-20 md:h-28 bg-gray-50 dark:bg-zinc-900 rounded-xl mb-2 overflow-hidden flex items-center justify-center relative shadow-inner transition-colors duration-500">
                 <ScanFace size={40} className="text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
                 <div className="absolute top-0 left-0 w-full h-1 bg-[#34A853]/50 blur-[2px] animate-pulse"></div>
              </div>
              <div className="flex gap-2 items-center">
                 <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-[#4285F4] transition-colors duration-500">
                    <ShieldCheck size={18} />
                 </div>
                 <div className="flex-1 space-y-1">
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full transition-colors duration-500"></div>
                    <div className="w-2/3 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full transition-colors duration-500"></div>
                 </div>
              </div>
           </motion.div>

           {/* Floating Element 2: QR Code Card */}
           <motion.div 
             animate={{ y: [0, -15, 0] }}
             transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
             className="hidden sm:block absolute top-[8%] md:top-[5%] right-[0%] md:right-[3%] z-20 w-22 md:w-28 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-2.5 md:p-3 transform rotate-[15deg] border border-gray-100 dark:border-zinc-700 transition-colors duration-500"
           >
             <div className="w-full aspect-square border-2 border-gray-800 dark:border-zinc-700 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-zinc-900 transition-colors duration-500">
               <QrCode size={32} className="text-gray-800 dark:text-gray-200" />
             </div>
           </motion.div>
         </motion.div>

      </div>
    </div>
  );
}
