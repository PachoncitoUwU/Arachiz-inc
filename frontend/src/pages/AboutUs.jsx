import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Target, Code, Database, Palette, Instagram, Coffee, Heart, Sparkles } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

export default function AboutUs() {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');
  const [amountError, setAmountError] = useState('');
  const [error, setError] = useState('');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  // Funciones de donación
  const handleDonate = () => {
    setDonationAmount('');
    setAmountError('');
    setShowDonationModal(true);
  };

  const handleAmountChange = (e) => {
    const raw = e.target.value.replace(/\./g, '').replace(/\D/g, '');
    setDonationAmount(raw);
    const value = parseInt(raw) || 0;
    if (raw !== '' && value < 1000) {
      setAmountError('El monto mínimo es $1.000 COP');
    } else {
      setAmountError('');
    }
  };

  const handleQuickAmount = (amount) => {
    setDonationAmount(amount.toString());
    setAmountError('');
  };

  const parsedAmount = parseInt(donationAmount) || 0;
  const isAmountValid = parsedAmount >= 1000;

  const handleProceedToConfirm = () => {
    if (!isAmountValid) {
      setAmountError(donationAmount === '' ? 'Ingresa un monto' : 'El monto mínimo es $1.000 COP');
      return;
    }
    setShowDonationModal(false);
    setShowConfirmModal(true);
  };

  const loadWompiScript = () => {
    return new Promise((resolve) => {
      if (typeof window.WidgetCheckout !== 'undefined') {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = "https://checkout.wompi.co/widget.js";
      script.type = "text/javascript";
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  };

  const openWompi = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/skins/wompi-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parsedAmount })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Error al iniciar pago');
      }

      const { reference, amountInCents, currency, integrityHash, publicKey, redirectUrl } = await response.json();
      await loadWompiScript();

      const checkout = new window.WidgetCheckout({
        currency,
        amountInCents,
        reference,
        publicKey,
        signature: {
          integrity: integrityHash
        },
        redirectUrl
      });

      checkout.open((result) => {
        const transaction = result.transaction;
        console.log('Transaction status:', transaction.status);
      });

    } catch (err) {
      setError('Error al procesar pago con Wompi: ' + err.message);
    }
  };

  const handleConfirmDonation = async () => {
    await openWompi();
    setShowConfirmModal(false);
  };

  const colaboradores = [
    {
      nombre: "Samuel Mahecha Díaz",
      rol: "Frontend & Styles",
      icon: Palette,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      instagram: "https://www.instagram.com/samn0x_369?igsh=MWI4dGtoYnhjcm92bA==",
      username: "@samn0x_369"
    },
    {
      nombre: "Miguel Pachón",
      rol: "Backend & Frontend",
      icon: Code,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      instagram: "https://www.instagram.com/pachonzabala?igsh=MTBtbXhpNjRqaHp5eQ==",
      username: "@pachonzabala"
    },
    {
      nombre: "Dylan Blandón",
      rol: "Backend",
      icon: Code,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      instagram: "https://www.instagram.com/ddbl_27?igsh=MXIwd3BoOWJhYWdtZA==",
      username: "@ddbl_27"
    },
    {
      nombre: "Daniel Romero",
      rol: "Databases",
      icon: Database,
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      instagram: "https://www.instagram.com/08__danirm?igsh=Y3B0MWJmNWR1NWcx",
      username: "@08__danirm"
    },
    {
      nombre: "José Correa",
      rol: "Databases",
      icon: Database,
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      instagram: "https://www.instagram.com/juanjo25280?igsh=bmJzODQybXljbm40",
      username: "@juanjo25280"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-gray-950 relative overflow-hidden font-sans transition-colors duration-500">
      
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

      {/* Botón Volver */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-50">
        <Link 
          to="/" 
          className="px-3 py-2 md:px-4 md:py-2.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-lg md:rounded-xl font-semibold text-sm hover:shadow-lg transition-all active:scale-95 border border-gray-200 dark:border-gray-700 flex items-center gap-2"
        >
          <ArrowLeft size={16} className="md:w-[18px] md:h-[18px]" />
          <span className="hidden sm:inline">Volver</span>
        </Link>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24 pt-16 sm:pt-16 md:pt-24">
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8 md:space-y-12"
        >
          
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center space-y-3 md:space-y-4">
            <div className="flex items-center justify-center gap-3 md:gap-4 mb-4 md:mb-6">
              <img 
                src="/ArachizLogoPNG.png" 
                alt="Arachiz Logo" 
                className="h-12 sm:h-14 md:h-16 lg:h-20 object-contain dark:invert transition-all duration-300" 
              />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight px-4">
              Sobre <span className="text-[#4285F4]">Nosotros</span>
            </h1>
          </motion.div>

          {/* ¿Qué es Arachiz? */}
          <motion.div 
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-10 shadow-lg border border-gray-200 dark:border-gray-700 transition-colors duration-500"
          >
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <Target className="text-[#4285F4]" size={20} />
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                ¿Qué es Arachiz?
              </h2>
            </div>
            <div className="space-y-3 md:space-y-4 text-gray-600 dark:text-gray-300 text-base md:text-lg leading-relaxed">
              <p>
                <strong className="text-gray-900 dark:text-white">Arachiz</strong> es una plataforma integral diseñada para revolucionar la gestión de asistencia en instituciones educativas. Nuestro software combina tecnología de vanguardia con una interfaz intuitiva para facilitar el control y seguimiento de la asistencia de estudiantes e instructores.
              </p>
              <p>
                Nos enfocamos en proporcionar múltiples métodos de registro de asistencia, incluyendo reconocimiento facial, códigos QR y huella digital, garantizando flexibilidad y seguridad en cada interacción.
              </p>
            </div>
          </motion.div>

          {/* Enfoque del Software */}
          <motion.div 
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-10 shadow-lg border border-gray-200 dark:border-gray-700 transition-colors duration-500"
          >
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                <Code className="text-[#34A853]" size={20} />
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Nuestro Enfoque
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2 md:space-y-3">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#4285F4]"></span>
                  Eficiencia
                </h3>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                  Automatización del proceso de registro de asistencia, reduciendo tiempos y errores manuales.
                </p>
              </div>
              <div className="space-y-2 md:space-y-3">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#34A853]"></span>
                  Seguridad
                </h3>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                  Protección de datos mediante autenticación robusta y encriptación de información sensible.
                </p>
              </div>
              <div className="space-y-2 md:space-y-3">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#EA4335]"></span>
                  Accesibilidad
                </h3>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                  Interfaz intuitiva y responsive, accesible desde cualquier dispositivo con conexión a internet.
                </p>
              </div>
              <div className="space-y-2 md:space-y-3">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FBBC05]"></span>
                  Innovación
                </h3>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                  Integración de tecnologías modernas como reconocimiento facial y biométrico para una experiencia única.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Colaboradores */}
          <motion.div 
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-10 shadow-lg border border-gray-200 dark:border-gray-700 transition-colors duration-500"
          >
            <div className="flex items-center gap-2 md:gap-3 mb-6 md:mb-8">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                <Users className="text-purple-500" size={20} />
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Colaboradores y Creadores
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {colaboradores.map((colaborador, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  onHoverStart={() => setHoveredCard(index)}
                  onHoverEnd={() => setHoveredCard(null)}
                  className={`${colaborador.bgColor} rounded-xl md:rounded-2xl p-5 md:p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl relative overflow-hidden cursor-pointer`}
                  style={{ minHeight: '180px' }}
                >
                  {/* Contenido Principal */}
                  <motion.div 
                    className="flex flex-col items-center text-center space-y-3 md:space-y-4"
                    animate={{ 
                      opacity: hoveredCard === index ? 0 : 1,
                      y: hoveredCard === index ? -10 : 0
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full ${colaborador.bgColor} flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-md`}>
                      <colaborador.icon className={colaborador.color} size={24} strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white mb-1">
                        {colaborador.nombre}
                      </h3>
                      <p className={`text-xs md:text-sm font-semibold ${colaborador.color}`}>
                        {colaborador.rol}
                      </p>
                    </div>
                  </motion.div>

                  {/* Contenido Hover - Instagram */}
                  <motion.div
                    className="absolute inset-0 flex flex-col items-center justify-center p-4 md:p-6 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: hoveredCard === index ? 1 : 0,
                      scale: hoveredCard === index ? 1 : 0.8
                    }}
                    transition={{ duration: 0.3 }}
                    style={{ pointerEvents: hoveredCard === index ? 'auto' : 'none' }}
                  >
                    <div className="text-center space-y-3 md:space-y-4">
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white shadow-lg mx-auto">
                        <Instagram className="text-white" size={24} strokeWidth={2} />
                      </div>
                      <div className="text-white space-y-1 md:space-y-2">
                        <p className="text-xs md:text-sm font-medium opacity-90">Sígueme en Instagram</p>
                        <p className="text-base md:text-lg font-bold">{colaborador.username}</p>
                      </div>
                      <a
                        href={colaborador.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 bg-white text-gray-900 rounded-lg md:rounded-xl font-bold text-xs md:text-sm hover:bg-gray-100 transition-all active:scale-95 shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Instagram size={18} />
                        Visitar Perfil
                      </a>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Sección de Donaciones */}
          <motion.div 
            variants={itemVariants}
            className="bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 dark:from-orange-900/20 dark:via-pink-900/20 dark:to-purple-900/20 rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-12 shadow-xl border-2 border-orange-200 dark:border-orange-700 transition-colors duration-500 relative overflow-hidden"
          >
            {/* Decoración de fondo */}
            <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-gradient-to-br from-yellow-200/30 to-orange-200/30 dark:from-yellow-900/10 dark:to-orange-900/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 md:w-48 md:h-48 bg-gradient-to-tr from-pink-200/30 to-purple-200/30 dark:from-pink-900/10 dark:to-purple-900/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="text-center mb-6 md:mb-8">
                <motion.div 
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                  className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-lg"
                >
                  <Coffee className="text-white" size={28} strokeWidth={2.5} />
                </motion.div>
                
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-3 md:mb-4 px-4">
                  ¿Te gusta <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500">Arachiz</span>?
                </h2>
                <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed px-4">
                  Tu apoyo nos ayuda a mantener y mejorar la plataforma. Cada donación, por pequeña que sea, hace una gran diferencia.
                </p>
              </div>

              {/* Beneficios de donar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 border border-orange-200 dark:border-orange-700">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg md:rounded-xl flex items-center justify-center mb-3 md:mb-4 mx-auto">
                    <Sparkles className="text-white" size={20} />
                  </div>
                  <h3 className="font-bold text-sm md:text-base text-gray-900 dark:text-white text-center mb-1 md:mb-2">Nuevas Funciones</h3>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 text-center">
                    Ayúdanos a desarrollar características innovadoras
                  </p>
                </div>
                
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 border border-pink-200 dark:border-pink-700">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-lg md:rounded-xl flex items-center justify-center mb-3 md:mb-4 mx-auto">
                    <Heart className="text-white" size={20} />
                  </div>
                  <h3 className="font-bold text-sm md:text-base text-gray-900 dark:text-white text-center mb-1 md:mb-2">Soporte Continuo</h3>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 text-center">
                    Mantén la plataforma activa y funcionando
                  </p>
                </div>
                
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 border border-purple-200 dark:border-purple-700">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg md:rounded-xl flex items-center justify-center mb-3 md:mb-4 mx-auto">
                    <Code className="text-white" size={20} />
                  </div>
                  <h3 className="font-bold text-sm md:text-base text-gray-900 dark:text-white text-center mb-1 md:mb-2">Mejoras Técnicas</h3>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 text-center">
                    Optimización y corrección de errores
                  </p>
                </div>
              </div>

              {/* Botón de donación */}
              <div className="text-center">
                <motion.button
                  onClick={handleDonate}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 md:gap-3 px-6 py-3 md:px-10 md:py-5 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 text-white rounded-xl md:rounded-2xl font-bold text-base md:text-lg shadow-2xl hover:shadow-3xl transition-all"
                >
                  <Coffee size={24} className="fill-current" />
                  Invítanos un Café ☕
                </motion.button>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-3 md:mt-4">
                  Pago seguro procesado por <span className="font-semibold">Wompi</span> 🔒
                </p>
              </div>
            </div>
          </motion.div>

        </motion.div>
      </div>

      {/* Modal de Donación */}
      {showDonationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Coffee size={28} className="text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Invítanos un café ☕</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Vía Wompi</p>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Cuánto quieres donar?
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-bold text-lg">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  value={donationAmount === '' ? '' : parseInt(donationAmount).toLocaleString('es-CO')}
                  onChange={handleAmountChange}
                  placeholder="5.000"
                  className={`w-full border-2 rounded-xl pl-9 pr-16 py-4 text-xl font-bold focus:outline-none transition-all dark:bg-gray-700 dark:text-white ${
                    amountError
                      ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 focus:border-red-500'
                      : isAmountValid
                      ? 'border-green-400 bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-white focus:border-green-500'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-[#4285F4]'
                  }`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm font-medium">COP</span>
              </div>

              {amountError && (
                <div className="mt-2 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg px-3 py-2">
                  <span className="text-base">⚠️</span>
                  <span>{amountError}</span>
                </div>
              )}

              {isAmountValid && !amountError && (
                <div className="mt-2 flex items-center gap-2 text-green-700 dark:text-green-400 text-sm bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg px-3 py-2">
                  <span className="text-base">✅</span>
                  <span>Monto válido — ¡gracias por tu apoyo!</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2 mb-6">
              {[2000, 5000, 10000, 20000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleQuickAmount(amount)}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all border ${
                    parsedAmount === amount
                      ? 'bg-[#4285F4] text-white border-[#4285F4]'
                      : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-[#4285F4] hover:text-[#4285F4]'
                  }`}
                >
                  ${(amount / 1000).toFixed(0)}K
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowDonationModal(false); setAmountError(''); }}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleProceedToConfirm}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
                  isAmountValid
                    ? 'bg-[#4285F4] text-white hover:bg-[#3367d6] active:scale-95'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                Continuar →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎉</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">¿Confirmas la donación?</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Revisa los detalles antes de continuar</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-5 mb-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400 text-sm">Monto</span>
                <span className="text-2xl font-bold text-[#4285F4]">
                  ${parsedAmount.toLocaleString('es-CO')} COP
                </span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-600 pt-3 flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400 text-sm">Método de pago</span>
                <span className="font-semibold text-gray-900 dark:text-white bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 px-3 py-1 rounded-full text-sm">
                  Wompi
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-6">
              Serás redirigido a Wompi para completar el pago de forma segura 🔒
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowConfirmModal(false); setShowDonationModal(true); }}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                ← Atrás
              </button>
              <button
                onClick={handleConfirmDonation}
                className="flex-1 bg-[#4285F4] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#3367d6] transition-colors active:scale-95"
              >
                Pagar ahora 💳
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
