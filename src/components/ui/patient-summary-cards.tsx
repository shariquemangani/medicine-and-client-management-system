'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, ClipboardList, Droplet, Utensils, Phone, Zap } from 'lucide-react';
import { PatientSummaryCard } from '@/data/mockPatients';

interface PatientSummaryCardsProps {
  cards: PatientSummaryCard[];
  selectedCardId?: string;
  onCardClick: (cardId: string) => void;
}

const iconMap = {
  users: Users,
  'clipboard-list': ClipboardList,
  droplet: Droplet,
  utensils: Utensils,
  phone: Phone,
  zap: Zap,
};

export function PatientSummaryCards({ cards, selectedCardId, onCardClick }: PatientSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = iconMap[card.icon as keyof typeof iconMap];
        const isSelected = selectedCardId === card.id;

        return (
          <Card
            key={card.id}
            className={`p-4 cursor-pointer transition-all duration-200 ease-in-out border-none shadow-[0_8px_32px_rgba(15,23,42,0.08)] hover:shadow-lg hover:scale-[1.02] ${
              isSelected
                ? 'ring-2 ring-primary/30 bg-primary/10'
                : 'bg-card'
            }`}
            onClick={() => onCardClick(card.id)}
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-300 ease-in-out hover:bg-primary/20 hover:scale-110">
                {Icon && <Icon className="w-5 h-5 text-primary transition-all duration-300" />}
              </div>
              <div className="text-2xl font-bold text-gray-900 transition-colors duration-300">{card.value.toString().padStart(2, '0')}</div>
              <div className="text-sm text-gray-600 transition-colors duration-300">{card.label}</div>
              {card.subtext && (
                <div className="text-xs text-gray-500 transition-colors duration-300">{card.subtext}</div>
              )}
              {card.requiresAction && (
                <Badge variant="destructive" className="text-xs transition-all duration-300">
                  Action required
                </Badge>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
