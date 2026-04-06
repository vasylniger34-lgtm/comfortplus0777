import { motion } from 'framer-motion';
import { Clock, Info } from 'lucide-react';

export default function ScheduleBlockMockup() {
  return (
    <section id="schedule" className="max-w-6xl mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <div className="label mb-3">Як ми працюємо</div>
        <h2 className="section-title mb-3 text-[#F5A623]">Гнучкість та Доступність</h2>
        <p className="text-brand-muted max-w-2xl mx-auto text-sm leading-relaxed">
          Ми відмовилися від жорстких публічних графіків на користь індивідуального планування. 
          Замість фіксованоо часу ми пропонуємо <b>вікна доступності екіпажів</b>, що дозволяє нам бути більш гнучкими та безпечними.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="card p-6 bg-brand-surface border-brand-border">
            <div className="w-10 h-10 bg-brand-yellow/10 rounded-xl flex items-center justify-center mb-4 text-brand-yellow">
                <Clock size={20} />
            </div>
            <h3 className="text-white font-bold mb-2">Жива Доступність</h3>
            <p className="text-brand-muted text-xs">Ми показуємо лише ті авто, які дійсно вільні та готові до виїзду в обраний вами період.</p>
        </div>
        <div className="card p-6 bg-brand-surface border-brand-border">
            <div className="w-10 h-10 bg-brand-yellow/10 rounded-xl flex items-center justify-center mb-4 text-brand-yellow">
                <Info size={20} />
            </div>
            <h3 className="text-white font-bold mb-2">Орієнтовний Час</h3>
            <p className="text-brand-muted text-xs">Час виїзду є орієнтовним (+/- 10 хв), що дозволяє водію безпечно адаптуватися до дорожньої ситуації.</p>
        </div>
        <div className="card p-6 bg-brand-surface border-brand-border border-dashed">
            <div className="w-10 h-10 bg-brand-yellow/10 rounded-xl flex items-center justify-center mb-4 text-brand-yellow">
                <div className="w-2 h-2 rounded-full bg-brand-yellow animate-pulse" />
            </div>
            <h3 className="text-white font-bold mb-2">Завжди на зв'язку</h3>
            <p className="text-brand-muted text-xs">Після бронювання вільного вікна, диспетчер підтвердить точний час подачі авто.</p>
        </div>
      </div>
    </section>
  );
}
