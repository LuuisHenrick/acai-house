import React from 'react';
import { Star, Users, Heart, Clock } from 'lucide-react';

export default function About() {
  return (
    <section id="about" className="py-12 sm:py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Sobre a Açaí House</h2>
          <p className="text-lg sm:text-xl text-gray-600">
            Transformando momentos em memórias deliciosas, um açaí de cada vez
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center mb-16 sm:mb-20">
          <div className="space-y-6">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Nossa História</h3>
            <p className="text-gray-600 leading-relaxed">
              Fundada em 2020, a Açaí House nasceu do sonho de trazer para a região Oeste
              de Belo Horizonte uma experiência única com o autêntico açaí amazônico.
              Nossa jornada começou com uma pequena loja e uma grande paixão por servir
              o melhor açaí da cidade.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Hoje, somos reconhecidos não apenas pela qualidade excepcional dos nossos
              produtos, mas também pelo atendimento caloroso e ambiente acolhedor que
              oferecemos aos nossos clientes.
            </p>
          </div>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1596463119248-53c8d33d2739?auto=format&fit=crop&q=80&width=600&quality=80"
              alt="Açaí House Interior"
              className="rounded-lg shadow-xl w-full"
              loading="lazy"
            />
            <div className="absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6 bg-purple-600 text-white p-4 sm:p-6 rounded-lg shadow-lg">
              <p className="text-2xl sm:text-3xl font-bold">3+ Anos</p>
              <p className="text-sm">de experiência</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-16 sm:mb-20">
          <div className="text-center p-4 sm:p-6 bg-purple-50 rounded-lg">
            <Star className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600 mx-auto mb-4" />
            <h4 className="text-lg sm:text-xl font-semibold mb-2">Qualidade Premium</h4>
            <p className="text-gray-600 text-sm sm:text-base">
              Selecionamos apenas os melhores ingredientes para nossos produtos
            </p>
          </div>
          <div className="text-center p-4 sm:p-6 bg-purple-50 rounded-lg">
            <Users className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600 mx-auto mb-4" />
            <h4 className="text-lg sm:text-xl font-semibold mb-2">Atendimento Especial</h4>
            <p className="text-gray-600 text-sm sm:text-base">
              Nossa equipe é treinada para oferecer a melhor experiência
            </p>
          </div>
          <div className="text-center p-4 sm:p-6 bg-purple-50 rounded-lg">
            <Heart className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600 mx-auto mb-4" />
            <h4 className="text-lg sm:text-xl font-semibold mb-2">Feito com Amor</h4>
            <p className="text-gray-600 text-sm sm:text-base">
              Cada açaí é preparado com dedicação e carinho
            </p>
          </div>
          <div className="text-center p-4 sm:p-6 bg-purple-50 rounded-lg">
            <Clock className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600 mx-auto mb-4" />
            <h4 className="text-lg sm:text-xl font-semibold mb-2">Entrega Rápida</h4>
            <p className="text-gray-600 text-sm sm:text-base">
              Seu pedido chegará fresquinho e no tempo prometido
            </p>
          </div>
        </div>

        <div className="bg-purple-900 text-white rounded-2xl p-6 sm:p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-xl sm:text-2xl font-bold">Nossos Valores</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-purple-500 flex items-center justify-center mt-1">
                    <span className="text-sm">1</span>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-base sm:text-lg font-semibold">Qualidade Sem Compromisso</h4>
                    <p className="text-purple-200 text-sm sm:text-base">
                      Utilizamos apenas açaí puro e ingredientes frescos de alta qualidade
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-purple-500 flex items-center justify-center mt-1">
                    <span className="text-sm">2</span>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-base sm:text-lg font-semibold">Satisfação do Cliente</h4>
                    <p className="text-purple-200 text-sm sm:text-base">
                      Nosso objetivo é superar as expectativas em cada atendimento
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-purple-500 flex items-center justify-center mt-1">
                    <span className="text-sm">3</span>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-base sm:text-lg font-semibold">Inovação Constante</h4>
                    <p className="text-purple-200 text-sm sm:text-base">
                      Sempre buscando novas combinações e sabores para nossos clientes
                    </p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1596463119298-3e5d8d8b4001?auto=format&fit=crop&q=80&width=600&quality=80"
                alt="Açaí Bowl"
                className="rounded-lg shadow-xl w-full"
                loading="lazy"
              />
              <div className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 bg-white text-purple-900 p-4 sm:p-6 rounded-lg shadow-lg">
                <p className="text-2xl sm:text-3xl font-bold">5000+</p>
                <p className="text-sm">clientes satisfeitos</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 sm:mt-20 text-center">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
            O Que Nossos Clientes Dizem
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
              <div className="flex text-yellow-400 mb-4 justify-center">
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
              </div>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                "O melhor açaí que já provei! Ingredientes frescos e atendimento
                excepcional."
              </p>
              <p className="font-semibold">Maria Silva</p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
              <div className="flex text-yellow-400 mb-4 justify-center">
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
              </div>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                "Ótimas opções de complementos e o açaí é sempre muito cremoso!"
              </p>
              <p className="font-semibold">João Santos</p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
              <div className="flex text-yellow-400 mb-4 justify-center">
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
              </div>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                "Delivery sempre rápido e o açaí chega na temperatura ideal!"
              </p>
              <p className="font-semibold">Ana Oliveira</p>
            </div>
          </div>
        </div>

        <div className="mt-16 sm:mt-20 text-center">
          <button
            onClick={() => {
              const contactElement = document.getElementById('contact');
              if (contactElement) {
                contactElement.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="inline-block bg-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold hover:bg-purple-700 transition transform hover:scale-105"
          >
            Entre em Contato
          </button>
        </div>
      </div>
    </section>
  );
}