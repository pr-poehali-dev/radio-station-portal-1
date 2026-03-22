import Icon from '@/components/ui/icon';

export default function Donate() {
  return (
    <div className="container py-10 max-w-2xl animate-fade-in">

      <div className="text-center mb-10">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center mx-auto mb-4 neon-glow">
          <Icon name="Heart" size={36} className="text-white" />
        </div>
        <h1 className="font-oswald text-3xl md:text-4xl font-bold mb-3">Поддержите проект</h1>
        <p className="text-muted-foreground text-base max-w-md mx-auto">
          Ваша поддержка помогает нам добавлять новые станции, улучшать качество и делать сервис лучше для всех
        </p>
      </div>

      {/* Tiers */}
      <div className="grid gap-4 mb-8">
        {[
          { amount: '100 ₽', icon: 'Coffee', title: 'Чашка кофе', desc: 'Поддержите разработчика', color: 'from-amber-600 to-yellow-600' },
          { amount: '500 ₽', icon: 'Zap', title: 'Активный слушатель', desc: 'Помогаете улучшить скорость', color: 'from-purple-600 to-blue-600', popular: true },
          { amount: '1000 ₽', icon: 'Star', title: 'Меценат', desc: 'Финансируете новые функции', color: 'from-pink-600 to-purple-600' },
          { amount: 'Другая сумма', icon: 'Gift', title: 'Своя сумма', desc: 'Любой вклад важен', color: 'from-green-600 to-teal-600' },
        ].map((tier) => (
          <div
            key={tier.amount}
            className={`relative gradient-card rounded-2xl p-5 flex items-center gap-4 hover:scale-[1.02] transition-all cursor-pointer ${tier.popular ? 'neon-border' : 'hover:border-primary/30'}`}
          >
            {tier.popular && (
              <div className="absolute -top-2.5 left-4 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                Популярно
              </div>
            )}
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center flex-shrink-0`}>
              <Icon name={tier.icon} size={22} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{tier.title}</p>
              <p className="text-sm text-muted-foreground">{tier.desc}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-oswald font-bold text-lg gradient-text">{tier.amount}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Payment methods */}
      <div className="gradient-card rounded-2xl p-6 text-center neon-border">
        <h3 className="font-semibold mb-4">Способы оплаты</h3>
        <div className="flex justify-center gap-4 flex-wrap mb-4">
          {['СБП', 'Карта', 'ЮMoney', 'QIWI'].map(m => (
            <span key={m} className="px-4 py-2 rounded-xl bg-secondary text-sm font-medium">{m}</span>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Нажмите на сумму выше для перехода к оплате. Все платежи безопасны и защищены.
        </p>
        <button className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
          <Icon name="Heart" size={18} />
          Поддержать прямо сейчас
        </button>
      </div>

    </div>
  );
}
