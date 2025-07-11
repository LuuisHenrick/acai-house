import React, { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, Clock, Instagram, Facebook, Send, MessageCircle, Music, ShoppingBag } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface ContactSettings {
  instagram_url: string;
  facebook_url: string;
  ifood_url: string;
  tiktok_url: string;
  whatsapp_url: string;
  phone_number: string;
  email_contact: string;
}

export default function Contact() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [contactSettings, setContactSettings] = useState<ContactSettings>({
    instagram_url: 'https://instagram.com/acaihouse',
    facebook_url: 'https://facebook.com/acaihouse',
    ifood_url: '',
    tiktok_url: '',
    whatsapp_url: 'https://api.whatsapp.com/send?phone=5531993183738',
    phone_number: '(31) 99318-3738',
    email_contact: 'contato@acaihouse.com.br'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    loadContactSettings();
  }, []);

  const loadContactSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value')
        .in('setting_key', [
          'instagram_url', 'facebook_url', 'ifood_url', 
          'tiktok_url', 'whatsapp_url', 'phone_number', 'email_contact'
        ]);

      if (error) {
        console.error('Error loading contact settings:', error);
        return;
      }

      if (data && data.length > 0) {
        const settingsMap = data.reduce((acc, item) => {
          acc[item.setting_key] = item.setting_value || '';
          return acc;
        }, {} as Record<string, string>);

        setContactSettings(prev => ({
          ...prev,
          ...settingsMap
        }));
      }
    } catch (error) {
      console.error('Error loading contact settings:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Here you would typically send the form data to your backend
    console.log('Form submitted:', formData);
    
    setSubmitStatus('success');
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
    
    // Reset success message after 3 seconds
    setTimeout(() => setSubmitStatus(null), 3000);
  };

  const socialMediaLinks = [
    {
      name: 'Instagram',
      url: contactSettings.instagram_url,
      icon: Instagram,
      color: 'text-pink-600 hover:bg-pink-100'
    },
    {
      name: 'Facebook',
      url: contactSettings.facebook_url,
      icon: Facebook,
      color: 'text-blue-600 hover:bg-blue-100'
    },
    {
      name: 'TikTok',
      url: contactSettings.tiktok_url,
      icon: Music,
      color: 'text-black hover:bg-gray-100'
    },
    {
      name: 'iFood',
      url: contactSettings.ifood_url,
      icon: ShoppingBag,
      color: 'text-red-600 hover:bg-red-100'
    },
    {
      name: 'WhatsApp',
      url: contactSettings.whatsapp_url,
      icon: MessageCircle,
      color: 'text-green-600 hover:bg-green-100'
    }
  ].filter(social => social.url); // Only show configured social media

  return (
    <section id="contact" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Entre em Contato</h2>
          <p className="text-xl text-gray-600">
            Estamos aqui para atender você! Tire suas dúvidas ou faça seu pedido
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Informações de Contato
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <Phone className="h-6 w-6 text-purple-600 mt-1" />
                  <div className="ml-4">
                    <h4 className="font-semibold">Telefone & WhatsApp</h4>
                    <a 
                      href={`tel:${contactSettings.phone_number.replace(/\D/g, '')}`}
                      className="text-gray-600 hover:text-purple-600 transition"
                    >
                      {contactSettings.phone_number}
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <Mail className="h-6 w-6 text-purple-600 mt-1" />
                  <div className="ml-4">
                    <h4 className="font-semibold">E-mail</h4>
                    <a 
                      href={`mailto:${contactSettings.email_contact}`}
                      className="text-gray-600 hover:text-purple-600 transition"
                    >
                      {contactSettings.email_contact}
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <MapPin className="h-6 w-6 text-purple-600 mt-1" />
                  <div className="ml-4">
                    <h4 className="font-semibold">Endereço</h4>
                    <p className="text-gray-600">
                      R. Pastor Belmiro Amorim, 240 - Vista Alegre<br />
                      Belo Horizonte - MG, 30516-250
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Clock className="h-6 w-6 text-purple-600 mt-1" />
                  <div className="ml-4">
                    <h4 className="font-semibold">Horário de Funcionamento</h4>
                    <p className="text-gray-600">
                      Terça a Domingo: 14h - 23h<br />
                      Domingo: 15h - 23h
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Media Links */}
              {socialMediaLinks.length > 0 && (
                <div className="mt-8 pt-8 border-t">
                  <h4 className="font-semibold mb-4">Redes Sociais</h4>
                  <div className="flex flex-wrap gap-3">
                    {socialMediaLinks.map((social) => (
                      <a
                        key={social.name}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-3 rounded-full transition ${social.color}`}
                        title={social.name}
                      >
                        <social.icon className="h-6 w-6" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Map */}
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3750.9590029571687!2d-43.9771463!3d-19.9269624!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTnCsDU1JzM3LjEiUyA0M8KwNTgnMzcuNyJX!5e0!3m2!1spt-BR!2sbr!4v1635789012345!5m2!1spt-BR!2sbr"
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="rounded-lg"
              ></iframe>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Envie uma Mensagem
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Digite seu nome"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Digite seu e-mail"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assunto
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Digite o assunto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensagem
                </label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Digite sua mensagem"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold
                  hover:bg-purple-700 transition flex items-center justify-center
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Enviando...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Send className="h-5 w-5 mr-2" />
                    Enviar Mensagem
                  </span>
                )}
              </button>

              {submitStatus === 'success' && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
                  Mensagem enviada com sucesso! Retornaremos em breve.
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                  Erro ao enviar mensagem. Por favor, tente novamente.
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}