import React from 'react';
import { usePanelStore } from '../../store/usePanelStore';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';

export const BannerAlert: React.FC<{ onNavigate: (v: string) => void }> = ({ onNavigate }) => {
  const { balanceAlertVisible, getBalance } = usePanelStore();
  const balance = getBalance();

  return (
    <AnimatePresence>
      {balanceAlertVisible && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-red-600 text-white overflow-hidden shadow-2xl"
        >
          <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex-1 flex items-center">
                <span className="flex p-2 rounded-lg bg-red-700">
                  <AlertCircle className="h-5 w-5 text-white" aria-hidden="true" />
                </span>
                <p className="ml-3 font-bold text-sm tracking-tight">
                  <span className="md:hidden">Baixo Saldo: R$ {balance.toFixed(2)}</span>
                  <span className="hidden md:inline">
                    Atenção: Saldo Crítico (R$ {balance.toFixed(2)}). Solicitar envio de recursos às congregações para cobertura de gastos futuros.
                  </span>
                </p>
              </div>
              <div className="order-3 mt-0 flex-shrink-0 w-full sm:order-2 sm:w-auto">
                <Button 
                  onClick={() => onNavigate('treasury')}
                  className="flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-black text-red-600 bg-white hover:bg-red-50 transition-colors w-full"
                >
                  Ver Tesouraria
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
