import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { ImageWithFallback } from './figma/ImageWithFallback';

// Icon components
const XIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
);

const HelpCircleIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
    <path d="M12 17h.01"/>
  </svg>
);

const FileTextIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" x2="8" y1="13" y2="13"/>
    <line x1="16" x2="8" y1="17" y2="17"/>
    <line x1="10" x2="8" y1="9" y2="9"/>
  </svg>
);

const AwardIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="8" r="6"/>
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const MapPinIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

interface AboutClubViewProps {
  onClose: () => void;
}

export function AboutClubView({ onClose }: AboutClubViewProps) {
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed inset-0 bg-black z-50 overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-black/95 backdrop-blur-sm z-10 px-4 py-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl">О клубе</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center hover:bg-[#252525] transition-colors"
            >
              <XIcon className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-6 pb-24 space-y-4">
          {/* Q&A and Help Buttons with Cards Background */}
          <div className="grid grid-cols-2 gap-3 rounded-3xl overflow-hidden p-3 relative">
            {/* Cards Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=600&auto=format&fit=crop&q=80')`,
              }}
            ></div>
            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-red-950/70"></div>
            
            <button 
              onClick={() => setIsOfferDialogOpen(true)}
              className="relative bg-black/40 backdrop-blur-sm rounded-2xl p-4 aspect-square flex flex-col items-center justify-center hover:bg-black/60 transition-all border border-red-900/30 shadow-lg"
            >
              <div className="w-10 h-10 bg-red-700/30 rounded-full flex items-center justify-center mb-2">
                <FileTextIcon className="w-5 h-5 text-red-500" />
              </div>
              <div className="text-xs text-center text-white font-medium">Q&A</div>
            </button>

            <button 
              onClick={() => window.open('https://t.me/oguseru', '_blank')}
              className="relative bg-black/40 backdrop-blur-sm rounded-2xl p-4 aspect-square flex flex-col items-center justify-center hover:bg-black/60 transition-all border border-red-900/30 shadow-lg"
            >
              <div className="w-10 h-10 bg-red-700/30 rounded-full flex items-center justify-center mb-2">
                <HelpCircleIcon className="w-5 h-5 text-red-500" />
              </div>
              <div className="text-xs text-center text-white font-medium">Помощь</div>
            </button>
          </div>

          {/* Hero Image */}
          <div className="rounded-3xl overflow-hidden">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1598334273979-264c1628b9c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb2tlciUyMGNsdWIlMjBsdXh1cnl8ZW58MXx8fHwxNzYxNDc2MzAwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Покерный клуб"
              className="w-full h-48 object-cover"
            />
          </div>

          {/* Main Article */}
          <div className="bg-[#1a1a1a] rounded-3xl p-5 space-y-4">
            <div>
              <h3 className="text-xl mb-3">Добро пожаловать в премиальный покерный клуб</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Наш клуб — это место, где страсть к покеру встречается с роскошью и комфортом. 
                Мы создали пространство для истинных ценителей игры, где каждая деталь продумана 
                до мелочей.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="bg-gradient-to-br from-red-900/30 to-red-950/30 rounded-2xl p-3 border border-red-900/30 text-center">
                <div className="w-10 h-10 bg-red-700/20 rounded-full flex items-center justify-center mb-2 mx-auto">
                  <AwardIcon className="w-5 h-5 text-red-600" />
                </div>
                <div className="text-xs text-gray-300">Премиум<br/>качество</div>
              </div>

              <div className="bg-gradient-to-br from-red-900/30 to-red-950/30 rounded-2xl p-3 border border-red-900/30 text-center">
                <div className="w-10 h-10 bg-red-700/20 rounded-full flex items-center justify-center mb-2 mx-auto">
                  <UsersIcon className="w-5 h-5 text-red-600" />
                </div>
                <div className="text-xs text-gray-300">Сообщество<br/>игроков</div>
              </div>

              <div className="bg-gradient-to-br from-red-900/30 to-red-950/30 rounded-2xl p-3 border border-red-900/30 text-center">
                <div className="w-10 h-10 bg-red-700/20 rounded-full flex items-center justify-center mb-2 mx-auto">
                  <MapPinIcon className="w-5 h-5 text-red-600" />
                </div>
                <div className="text-xs text-gray-300">Удобное<br/>расположение</div>
              </div>
            </div>
          </div>

          {/* Image Section */}
          <div className="rounded-3xl overflow-hidden">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1560526396-82d093122bda?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb2tlciUyMHRhYmxlJTIwY2FyZHN8ZW58MXx8fHwxNzYxMzk5NzQwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Покерный стол"
              className="w-full h-48 object-cover"
            />
          </div>

          {/* About Section */}
          <div className="bg-[#1a1a1a] rounded-3xl p-5 space-y-4">
            <div>
              <h3 className="text-lg mb-3">Почему выбирают нас</h3>
              <div className="space-y-3 text-sm text-gray-400">
                <div className="flex gap-3">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="leading-relaxed">
                    <span className="text-gray-200">Профессиональные турниры</span> — регулярные события 
                    с различными форматами и бай-инами
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="leading-relaxed">
                    <span className="text-gray-200">Премиальная атмосфера</span> — современный интерьер, 
                    комфортные кресла и профессиональное оборудование
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="leading-relaxed">
                    <span className="text-gray-200">Сообщество единомышленников</span> — знакомьтесь 
                    с опытными игроками и развивайте свои навыки
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="leading-relaxed">
                    <span className="text-gray-200">Гибкий график</span> — игры проводятся ежедневно, 
                    выбирайте удобное время
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Another Image */}
          <div className="rounded-3xl overflow-hidden">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1759773911147-7f1b9816b6ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwY2FzaW5vJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzYxNDc2MzAxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Интерьер клуба"
              className="w-full h-48 object-cover"
            />
          </div>

          {/* Contact Section */}
          <div className="bg-gradient-to-br from-red-900/40 to-red-950/40 rounded-3xl p-5 border border-red-900/30">
            <h3 className="text-lg mb-3">Присоединяйтесь к нам</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Станьте частью нашего сообщества и откройте для себя мир профессионального покера 
              в атмосфере элегантности и комфорта.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <MapPinIcon className="w-4 h-4 text-red-400" />
              <span className="text-gray-300">г. Москва, ул. Примерная, д. 1</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Dialog for Q&A (Offer) */}
      <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white max-h-[80vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-2xl text-white">
              Оферта
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4 text-sm text-gray-300 leading-relaxed">
            <p>
              Настоящая оферта является официальным предложением игрового клуба о заключении договора на оказание услуг.
            </p>
            
            <div>
              <h4 className="text-white mb-2">1. Общие положения</h4>
              <p>
                Данное соглашение определяет условия предоставления услуг игрового клуба и регулирует отношения между клубом и его участниками.
              </p>
            </div>

            <div>
              <h4 className="text-white mb-2">2. Услуги клуба</h4>
              <p>
                Клуб предоставляет возможность участия в турнирах по покеру, кэш-играх и других игровых мероприятиях на территории клуба.
              </p>
            </div>

            <div>
              <h4 className="text-white mb-2">3. Правила участия</h4>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Участник обязуется соблюдать правила клуба</li>
                <li>Регистрация на турниры обязательна</li>
                <li>Отмена регистрации возможна не позднее чем за 2 часа до начала</li>
                <li>Участник несет ответственность за свои действия во время игры</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white mb-2">4. Финансовые условия</h4>
              <p>
                Все финансовые операции производятся в соответствии с тарифами клуба. Клуб не несет ответственности за финансовые потери участников во время игры.
              </p>
            </div>

            <div>
              <h4 className="text-white mb-2">5. Конфиденциальность</h4>
              <p>
                Клуб обязуется не разглашать персональные данные участников третьим лицам без их согласия, за исключением случаев, предусмотренных законодательством.
              </p>
            </div>

            <div>
              <h4 className="text-white mb-2">6. Ответственность</h4>
              <p>
                Клуб не несет ответственности за личные вещи участников. Участники обязуются вести себя корректно и уважительно по отношению к другим игрокам и персоналу клуба.
              </p>
            </div>

            <div>
              <h4 className="text-white mb-2">7. Заключительные положения</h4>
              <p>
                Клуб оставляет за собой право вносить изменения в настоящую оферту. Актуальная версия всегда доступна в приложении. Регистрируясь на мероприятия клуба, участник подтверждает свое согласие с условиями данной оферты.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


