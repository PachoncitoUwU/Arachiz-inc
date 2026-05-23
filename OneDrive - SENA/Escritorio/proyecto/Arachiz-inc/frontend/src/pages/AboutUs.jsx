import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Code, Database, Palette, Coffee, Instagram } from 'lucide-react';

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
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const collaborators = [
    {
      name: "Samuel Mahecha Díaz",
      role: "Diseño",
      icon: Palette,
      color: "from-purple-500 to-pink-500",
      instagram: "https://www.instagram.com/samn0x_369?igsh=MWI4dGtoYnhjcm92bA==",
      username: "@samn0x_369"
    },
    {
      name: "Miguel Pachón",
      role: "Backend & Frontend",
      icon: Code,
      color: "from-blue-500 to-cyan-500",
      instagram: "https://www.instagram.com/pachonzabala?igsh=MTBtbXhpNjRqaHp5eQ==",
      username: "@pachonzabala"
    },
    {
      name: "Dylan Blandón",
      role: "Backend",
      icon: Code,
      color: "from-green-500 to-emerald-500",
      instagram: "https://www.instagram.com/ddbl_27?igsh=MXIwd3BoOWJhYWdtZA==",
      username: "@ddbl_27"
    },
    {
      name: "Daniel Romero",
      role: "Databases",
      icon: Database,
      color: "from-orange-500 to-red-500",
      instagram: "https://www.instagram.com/08__danirm?igsh=Y3B0MWJmNWR1NWcx",
      username: "@08__danirm"
    },
    {
      name: "José Correa",
      role: "Databases",
      icon: Database,
      color: "from-yellow-500 to-orange-500",
      instagram: "https://www.instagram.com/juanjo25280?igsh=bmJzODQybXljbm40",
      username: "@juanjo25280"
    }
  ];

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

  const handleConfirmDonation = async () => {
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

      setShowConfirmModal(false);
    } catch (err) {
      setError('Error al procesar pago con Wompi: ' + err.message);
      setShowConfirmModal(false);
    }
  };


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
          className="absolute bottom-[10%] -right-[10%] w-[400px] h-[400px] rounded-full bg-green-200/40 dark:bg-green-900/20 blur-[80px]"
        />
      </div>

      {/* Modal de Donación */}
      {showDonationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-sm w-full">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Coffee size={28} className="text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Invítanos a unas peras de maní 🥜</h3>
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
                  className={`w-full border-2 rounded-xl pl-9 pr-16 py-4 text-xl font-bold focus:outline-none transition-all dark:bg-gray-800 dark:text-white ${
                    amountError
                      ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 focus:border-red-500'
                      : isAmountValid
                      ? 'border-green-400 bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-white focus:border-green-500'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-[#4285F4]'
                  }`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm font-medium">COP</span>
              </div>

              {amountError && (
                <div className="mt-2 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                  <span className="text-base">⚠️</span>
                  <span>{amountError}</span>
                </div>
              )}

              {isAmountValid && !amountError && (
                <div className="mt-2 flex items-center gap-2 text-green-700 dark:text-green-400 text-sm bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
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
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#4285F4] hover:text-[#4285F4]'
                  }`}
                >
                  ${(amount / 1000).toFixed(0)}K
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowDonationModal(false); setAmountError(''); }}
                className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-sm w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎉</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">¿Confirmas la donación?</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Revisa los detalles antes de continuar</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 mb-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400 text-sm">Monto</span>
                <span className="text-2xl font-bold text-[#4285F4]">
                  ${parsedAmount.toLocaleString('es-CO')} COP
                </span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400 text-sm">Método de pago</span>
                <span className="font-semibold text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-3 py-1 rounded-full text-sm">
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
                className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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

      {/* Header with Back Button */}
      <div className="relative z-10 max-w-[1600px] mx-auto px-6 lg:px-16 pt-8">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#4285F4] dark:hover:text-[#4285F4] transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Volver al inicio</span>
        </Link>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-[1600px] mx-auto px-6 lg:px-16 py-12 lg:py-16">
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-12"
        >
          
          {/* Logo and Title */}
          <motion.div variants={itemVariants} className="text-center space-y-6 mb-8">
            <div className="flex justify-center mb-6">
              <img 
                src="/ArachizLogoPNG.png" 
                alt="Arachiz Logo" 
                className="h-20 md:h-24 object-contain dark:invert transition-all duration-300" 
              />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight">
              Sobre <span className="text-[#4285F4]">Nosotros</span>
            </h1>
          </motion.div>

          {/* Main Content - Horizontal Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            
            {/* Left Side - About Arachiz Section (Takes 3 columns) */}
            <motion.div 
              variants={itemVariants}
              className="lg:col-span-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl p-8 md:p-10 shadow-xl border border-gray-200/50 dark:border-gray-800/50 transition-colors duration-500"
            >
              <div className="mb-6">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">¿Qué es Arachiz?</h2>
              </div>
              
              <div className="space-y-6 text-gray-700 dark:text-gray-300 text-lg md:text-xl leading-relaxed">
                <p>
                  <strong className="text-gray-900 dark:text-white">Arachiz</strong> es una plataforma integral diseñada para revolucionar la gestión de asistencia en instituciones educativas. Nuestro software combina tecnología de vanguardia con una interfaz intuitiva para facilitar el control y seguimiento de la asistencia de estudiantes.
                </p>
                
                <p>
                  Nos enfocamos en proporcionar múltiples métodos de registro de asistencia, incluyendo reconocimiento biométrico, escaneo facial, códigos QR y más, garantizando flexibilidad y seguridad en cada interacción.
                </p>
                
                <p>
                  El software está orientado a optimizar la gestión administrativa, permitiendo a instructores y administradores gestionar fichas, horarios, materias y justificaciones de manera eficiente, todo desde una plataforma centralizada y accesible.
                </p>
              </div>
            </motion.div>

            {/* Right Side - Collaborators Section (Takes 2 columns) */}
            <motion.div 
              variants={itemVariants}
              className="lg:col-span-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl p-8 md:p-10 shadow-xl border border-gray-200/50 dark:border-gray-800/50 transition-colors duration-500"
            >
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#34A853] flex items-center justify-center shadow-lg">
                    <Users size={28} className="text-white" strokeWidth={2.5} />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Creadores</h2>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg">
                  El equipo detrás de Arachiz
                </p>
              </div>

              <div className="space-y-3">
                {/* Primera fila - 3 colaboradores */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {collaborators.slice(0, 3).map((collaborator, index) => {
                    const Icon = collaborator.icon;
                    const isHovered = hoveredCard === index;
                    
                    return (
                      <motion.div
                        key={index}
                        onMouseEnter={() => setHoveredCard(index)}
                        onMouseLeave={() => setHoveredCard(null)}
                        className="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 shadow-md border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 hover:shadow-xl overflow-hidden group cursor-pointer min-h-[120px]"
                      >
                        {/* Main Content */}
                        <div className={`flex flex-col items-center text-center gap-3 transition-all duration-300 ${isHovered ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${collaborator.color} flex items-center justify-center shadow-lg`}>
                            <Icon size={22} className="text-white" strokeWidth={2} />
                          </div>
                          
                          <div>
                            <h3 className="text-sm md:text-base font-bold text-gray-900 dark:text-white">
                              {collaborator.name}
                            </h3>
                            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">
                              {collaborator.role}
                            </p>
                          </div>
                        </div>

                        {/* Hover Content - Instagram */}
                        <div className={`absolute inset-0 flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 transition-all duration-300 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                          <div className="text-center space-y-2">
                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${collaborator.color} flex items-center justify-center shadow-xl mx-auto`}>
                              <Instagram size={22} className="text-white" strokeWidth={2} />
                            </div>
                            
                            <div>
                              <h3 className="text-xs md:text-sm font-bold text-gray-900 dark:text-white truncate">
                                {collaborator.name}
                              </h3>
                              <a
                                href={collaborator.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r ${collaborator.color} text-white rounded-lg font-semibold text-xs hover:shadow-xl transition-all active:scale-95 shadow-lg mt-2`}
                              >
                                <Instagram size={12} />
                                <span className="text-xs truncate">{collaborator.username}</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Segunda fila - 2 colaboradores centrados */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {collaborators.slice(3, 5).map((collaborator, index) => {
                    const actualIndex = index + 3;
                    const Icon = collaborator.icon;
                    const isHovered = hoveredCard === actualIndex;
                    
                    return (
                      <motion.div
                        key={actualIndex}
                        onMouseEnter={() => setHoveredCard(actualIndex)}
                        onMouseLeave={() => setHoveredCard(null)}
                        className="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 shadow-md border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 hover:shadow-xl overflow-hidden group cursor-pointer min-h-[120px]"
                      >
                        {/* Main Content */}
                        <div className={`flex flex-col items-center text-center gap-3 transition-all duration-300 ${isHovered ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${collaborator.color} flex items-center justify-center shadow-lg`}>
                            <Icon size={22} className="text-white" strokeWidth={2} />
                          </div>
                          
                          <div>
                            <h3 className="text-sm md:text-base font-bold text-gray-900 dark:text-white">
                              {collaborator.name}
                            </h3>
                            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">
                              {collaborator.role}
                            </p>
                          </div>
                        </div>

                        {/* Hover Content - Instagram */}
                        <div className={`absolute inset-0 flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 transition-all duration-300 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                          <div className="text-center space-y-2">
                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${collaborator.color} flex items-center justify-center shadow-xl mx-auto`}>
                              <Instagram size={22} className="text-white" strokeWidth={2} />
                            </div>
                            
                            <div>
                              <h3 className="text-xs md:text-sm font-bold text-gray-900 dark:text-white truncate">
                                {collaborator.name}
                              </h3>
                              <a
                                href={collaborator.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r ${collaborator.color} text-white rounded-lg font-semibold text-xs hover:shadow-xl transition-all active:scale-95 shadow-lg mt-2`}
                              >
                                <Instagram size={12} />
                                <span className="text-xs truncate">{collaborator.username}</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

          </div>

          {/* Support Section */}
          <motion.div 
            variants={itemVariants}
            className="bg-gradient-to-br from-[#4285F4]/10 to-[#34A853]/10 dark:from-[#4285F4]/20 dark:to-[#34A853]/20 backdrop-blur-sm rounded-3xl p-10 md:p-14 shadow-xl border border-[#4285F4]/20 dark:border-[#4285F4]/30 transition-colors duration-500"
          >
            <div className="text-center space-y-6">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#FF6B35] to-[#FF9D00] flex items-center justify-center shadow-2xl">
                  <Coffee size={40} className="text-white" strokeWidth={2.5} />
                </div>
              </div>
              
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                  ¿Deseas apoyarnos?
                </h2>
                <p className="text-gray-700 dark:text-gray-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                  Tu apoyo nos ayuda a mantener y mejorar Arachiz. Cada contribución, por pequeña que sea, hace una gran diferencia en nuestro proyecto.
                </p>
              </div>

              <button
                onClick={handleDonate}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#FF6B35] to-[#FF9D00] text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all active:scale-95 shadow-xl"
              >
                <Coffee size={24} className="fill-current" />
                <span>Invítanos a unas peras de maní</span>
              </button>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                Pago seguro procesado por Wompi 🔒
              </p>
            </div>
          </motion.div>

          {/* Footer CTA */}
          <motion.div 
            variants={itemVariants}
            className="text-center pt-8"
          >
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#4285F4] to-[#34A853] text-white rounded-xl font-semibold text-lg hover:shadow-2xl transition-all active:scale-95 shadow-lg"
            >
              Comenzar a usar Arachiz
            </Link>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
