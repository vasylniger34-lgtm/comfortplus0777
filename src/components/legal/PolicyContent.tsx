import React from 'react';
import { LEGAL_INFO, CONTACTS } from '../../data/routes';

export const PrivacyPolicy = () => (
  <div className="space-y-6 text-brand-light leading-relaxed text-sm">
    <div className="space-y-2">
      <h2 className="text-xl font-bold text-white">Політика конфіденційності</h2>
      <p className="text-brand-muted italic">Остання редакція: 2026-05-05</p>
    </div>

    <section className="space-y-3">
      <h3 className="text-lg font-semibold text-white">1. Загальні положення</h3>
      <p>1.1. Ця Політика конфіденційності визначає порядок обробки та захисту персональних даних користувачів сайту (далі — «Сайт»).</p>
      <p>1.2. Користуючись Сайтом та/або оформлюючи замовлення, Користувач надає згоду на обробку своїх персональних даних відповідно до цієї Політики.</p>
      <p>1.3. Політика розроблена згідно із законодавством України про захист персональних даних.</p>
    </section>

    <section className="space-y-3">
      <h3 className="text-lg font-semibold text-white">2. Адміністратор персональних даних</h3>
      <p>2.1. Адміністратором персональних даних є: {LEGAL_INFO.legalName}</p>
      <p>Місцезнаходження: {LEGAL_INFO.legalAddress}</p>
      <p>Ел. пошта: {LEGAL_INFO.email}</p>
      <p>Телефон: {CONTACTS.phone1}</p>
    </section>

    <section className="space-y-3">
      <h3 className="text-lg font-semibold text-white">3. Які дані ми збираємо</h3>
      <p>3.1. При оформленні замовлення: ім’я, прізвище, номер телефону, електронна пошта.</p>
      <p>3.2. Ми не збираємо та не обробляємо дані платіжних карток — оплата відбувається через захищені платіжні сервіси наших партнерів.</p>
    </section>

    <section className="space-y-3">
      <h3 className="text-lg font-semibold text-white">4. Мета обробки персональних даних</h3>
      <p>4.1. Обробка персональних даних здійснюється з метою:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>оформлення, обробки та виконання замовлень;</li>
        <li>комунікації з Користувачем щодо купівлі, бронювання квитків;</li>
        <li>надання відповідей на звернення Користувачів;</li>
        <li>виконання вимог законодавства України.</li>
      </ul>
    </section>

    <section className="space-y-3">
      <h3 className="text-lg font-semibold text-white">5. Передача персональних даних третім особам</h3>
      <p>5.1. Персональні дані можуть передаватися третім особам виключно для досягнення зазначених у цій Політиці цілей (платіжні сервіси, бухгалтерія тощо).</p>
      <p>5.2. Ми не продаємо персональні дані третім особам.</p>
    </section>

    <section className="space-y-3">
      <h3 className="text-lg font-semibold text-white">6. Захист персональних даних</h3>
      <p>6.1. Ми вживаємо необхідних організаційних та технічних заходів для захисту персональних даних від несанкціонованого доступу, зміни, розголошення або знищення.</p>
      <p>6.2. Доступ до персональних даних мають лише ті співробітники/підрядники, яким це необхідно для виконання своїх службових обов’язків.</p>
    </section>

    <section className="space-y-3 border-t border-brand-border pt-4">
      <p>З питань обробки даних звертайтесь на email: {LEGAL_INFO.email}</p>
    </section>
  </div>
);

export const PublicOffer = () => (
  <div className="space-y-6 text-brand-light leading-relaxed text-sm">
    <div className="space-y-2">
      <h2 className="text-xl font-bold text-white">Договір публічної оферти</h2>
      <p className="text-brand-muted italic">Про надання послуг з перевезення пасажирів</p>
    </div>

    <section className="space-y-3">
      <h3 className="text-lg font-semibold text-white">1. Загальні положення</h3>
      <p>1.1. Цей документ є офіційною публічною пропозицією (публічною офертою) {LEGAL_INFO.legalName} (далі — «Перевізник») укласти договір на надання послуг перевезення пасажирів автобусним транспортом.</p>
      <p>1.2. Відповідно до положень Цивільного кодексу України ця оферта є публічним договором, умови якого однакові для всіх користувачів.</p>
      <p>1.3. Моментом укладення договору вважається момент оплати квитка або підтвердження бронювання на сайті (акцепт оферти).</p>
    </section>

    <section className="space-y-3">
      <h3 className="text-lg font-semibold text-white">2. Права та обов’язки сторін</h3>
      <p><strong>Перевізник зобов’язаний:</strong> надати послугу перевезення належної якості, забезпечити безпечні умови перевезення, інформувати пасажирів про зміни у розкладі.</p>
      <p><strong>Пасажир зобов’язаний:</strong> надати коректні контактні дані, оплатити послугу, дотримуватися правил перевезення.</p>
    </section>

    <section className="space-y-3">
      <h3 className="text-lg font-semibold text-white">3. Ціни та порядок оплати</h3>
      <p>3.1. Вартість квитків зазначається на сайті.</p>
      <p>3.2. Оплата здійснюється банківською карткою або іншими доступними способами.</p>
      <p>3.3. Ціна на момент оформлення замовлення є остаточною для цього замовлення.</p>
    </section>

    <section className="space-y-3">
      <h3 className="text-lg font-semibold text-white">4. Порядок повернення квитків</h3>
      <p>4.1. Повернення квитків здійснюється відповідно до Політики повернення, розміщеної на сайті.</p>
      <p>4.2. Повернення коштів здійснюється тим самим способом, яким була проведена оплата.</p>
    </section>

    <section className="space-y-3">
      <h3 className="text-lg font-semibold text-white">5. Реквізити перевізника</h3>
      <p><strong>Компанія:</strong> {LEGAL_INFO.legalName}</p>
      <p><strong>ЄДРПОУ:</strong> {LEGAL_INFO.taxId}</p>
      <p><strong>Юридична адреса:</strong> {LEGAL_INFO.legalAddress}</p>
      <p><strong>Фактична адреса:</strong> {LEGAL_INFO.physicalAddress}</p>
      <p><strong>Р/р:</strong> {LEGAL_INFO.bankInfo}</p>
      <p><strong>Директор:</strong> {LEGAL_INFO.director}</p>
      <p><strong>Статус:</strong> {LEGAL_INFO.taxGroup}</p>
      <p><strong>Email:</strong> {LEGAL_INFO.email}</p>
      <p><strong>Телефон:</strong> {CONTACTS.phone1}</p>
    </section>
  </div>
);

export const RefundPolicy = () => (
  <div className="space-y-6 text-brand-light leading-relaxed text-sm">
    <div className="space-y-2">
      <h2 className="text-xl font-bold text-white">Політика повернення та скасування</h2>
    </div>

    <section className="space-y-3">
      <h3 className="text-lg font-semibold text-white">1. Скасування замовлення</h3>
      <p>Замовник може скасувати бронювання не пізніше ніж за 2 години до відправлення рейсу через особистий кабінет або за телефоном {CONTACTS.phone1}.</p>
    </section>

    <section className="space-y-3">
      <h3 className="text-lg font-semibold text-white">2. Повернення коштів</h3>
      <p>
        При скасуванні за 2+ години повертається 100% вартості. 
        При скасуванні менш ніж за 2 години кошти не повертаються, але можливе перенесення рейсу за погодженням з диспетчером.
      </p>
    </section>

    <section className="space-y-3">
      <h3 className="text-lg font-semibold text-white">3. Терміни повернення</h3>
      <p>Повернення коштів на картку здійснюється протягом 1-5 робочих днів залежно від вашого банку.</p>
    </section>

    <section className="space-y-3">
      <h3 className="text-lg font-semibold text-white">4. Доставка</h3>
      <p>Послуга надається у формі електронного квитка, який доступний в особистому кабінеті відразу після оплати.</p>
    </section>
  </div>
);

