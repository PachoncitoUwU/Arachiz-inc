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
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-zinc-950 relative overflow-hidden flex flex-col font-sans transition-colors duration-500">
      
      {/* Botón Sobre Nosotros - Esquina Superior Derecha */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50">
        <Link 
          to="/about" 
          className="px-4 py-2 md:px-6 md:py-2.5 bg-white dark:bg-zinc-800  dark:bg-zinc-800 text-gray-800 dark:text-white rounded-lg md:rounded-xl font-semibold text-xs md:text-sm hover:shadow-lg hover:scale-105 transition-all active:scale-95 border border-gray-300 dark:border-zinc-600 flex items-center gap-2"
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
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-between max-w-7xl mx-auto w-full px-6 lg:px-12 py-12 lg:py-24">
        
        {/* Left Content */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex-1 w-full max-w-2xl text-center lg:text-left space-y-8 z-20 mb-16 lg:mb-0"
        >
          {/* Logo Section */}
          <motion.div variants={itemVariants} className="flex items-center justify-center lg:justify-start gap-4 mb-8">
             <img 
               src={worldCupMode ? "/Arachiz-worldcup.png" : "/ArachizLogoPNG.png"} 
               alt="Arachiz Logo" 
               className="h-16 md:h-20 object-contain dark:invert transition-all duration-300" 
             />
          </motion.div>

          {/* Titles */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h1 className="text-3xl md:text-4xl  md:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white  dark:text-white leading-[1.1] tracking-tight">
              MÉTODOS DE <br className="hidden md:block" />
              <span className="text-[#4285F4]">ASISTENCIA</span>
            </h1>
          </motion.div>
          
          <motion.p variants={itemVariants} className="text-gray-600 dark:text-gray-400 text-lg md:text-xl max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Plataforma integral para el control y registro de asistencia. Accede a tu cuenta para gestionar fichas, horarios y justificaciones de manera eficiente y segura.
          </motion.p>
          
          {/* Buttons */}
          <motion.div variants={itemVariants} className="pt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Link 
              to="/register" 
              className="w-full sm:w-auto px-8 py-3.5 bg-[#34A853] text-white rounded-xl font-semibold text-lg hover:bg-green-600 transition-all active:scale-95 shadow-lg shadow-green-500/30 flex justify-center items-center"
            >
              Registrarse
            </Link>
            <Link 
              to="/login" 
              className="w-full sm:w-auto px-8 py-3.5 bg-[#4285F4] text-white rounded-xl font-semibold text-lg hover:bg-[#3367d6] transition-all active:scale-95 shadow-lg shadow-blue-500/30 flex justify-center items-center"
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
          className="flex-1 w-full flex justify-center items-center relative min-h-[320px] sm:min-h-[400px] lg:min-h-[600px] z-10"
        >
           {/* Center Mockup */}
           <motion.div 
             variants={floatVariants}
             animate="animate"
             className="relative z-20 w-[200px] sm:w-[260px] md:w-[320px] h-[300px] sm:h-[400px] md:h-[500px] bg-white dark:bg-zinc-800  dark:bg-zinc-800 rounded-[25px] sm:rounded-[35px] md:rounded-[45px] shadow-2xl border-4 sm:border-8 border-gray-100 dark:border-zinc-700  dark:border-zinc-700 flex flex-col items-center justify-center transform rotate-6 hover:rotate-3 transition-transform duration-500"
           >
              <div className="absolute inset-1 sm:inset-2 bg-[#F8FAFC] dark:bg-zinc-900 rounded-[18px] sm:rounded-[25px] md:rounded-[35px] shadow-inner flex flex-col items-center justify-center p-4 sm:p-4 md:p-6  overflow-hidden border border-gray-200 dark:border-zinc-700  dark:border-zinc-800 transition-colors duration-500">
                <div className="w-16 sm:w-24 md:w-32 h-20 sm:h-32 md:h-40 rounded-2xl sm:rounded-3xl flex items-center justify-center opacity-80 mb-4 sm:mb-6 bg-white dark:bg-zinc-800  dark:bg-zinc-800 shadow-md transition-colors duration-500">
                   <Fingerprint strokeWidth={1.5} className="text-[#4285F4] drop-shadow-sm w-12 h-12 sm:w-20 sm:h-20" />
                </div>
                <div className="mt-auto w-full h-8 sm:h-12 bg-gray-100 dark:bg-zinc-800 rounded-lg sm:rounded-xl flex items-center px-3 sm:px-4 shadow-sm border border-gray-200 dark:border-zinc-700  dark:border-zinc-700 transition-colors duration-500">
                   <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 font-medium">Reconocimiento...</span>
                </div>
              </div>
           </motion.div>
           
           {/* Floating Element 1: Face ID Card */}
           <motion.div 
             animate={{ y: [0, 20, 0] }}
             transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
             className="hidden sm:block absolute top-[5%] md:top-[10%] left-[0%] md:left-[5%] z-30 w-32 md:w-40 bg-white dark:bg-zinc-800  dark:bg-zinc-800 rounded-2xl shadow-xl p-3 transform -rotate-[12deg] border border-gray-100 dark:border-zinc-700  dark:border-zinc-700 transition-colors duration-500"
           >
              <div className="w-full h-24 md:h-32 bg-gray-50 dark:bg-zinc-900 rounded-xl mb-3 overflow-hidden flex items-center justify-center relative shadow-inner transition-colors duration-500">
                 <ScanFace size={48} className="text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
                 <div className="absolute top-0 left-0 w-full h-1 bg-[#34A853]/50 blur-[2px] animate-pulse"></div>
              </div>
              <div className="flex flex-wrap gap-2  items-center">
                 <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-[#4285F4] transition-colors duration-500">
                    <ShieldCheck size={20} />
                 </div>
                 <div className="flex-1 space-y-1.5">
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full transition-colors duration-500"></div>
                    <div className="w-2/3 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full transition-colors duration-500"></div>
                 </div>
              </div>
           </motion.div>

           {/* Floating Element 2: QR Code Card */}
           <motion.div 
             animate={{ y: [0, -15, 0] }}
             transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
             className="hidden sm:block absolute top-[10%] md:top-[5%] right-[0%] md:right-[5%] z-20 w-24 md:w-32 bg-white dark:bg-zinc-800  dark:bg-zinc-800 rounded-2xl shadow-xl p-3 md:p-4 transform rotate-[15deg] border border-gray-100 dark:border-zinc-700  dark:border-zinc-700 transition-colors duration-500"
           >
             <div className="w-full aspect-square border-2 border-gray-800 dark:border-gray-200 dark:border-zinc-700  rounded-xl flex items-center justify-center bg-gray-50 dark:bg-zinc-900 transition-colors duration-500">
               <QrCode size={40} className="text-gray-800 dark:text-gray-200" />
             </div>
           </motion.div>
         </motion.div>

      </div>
    </div>
  );
}
