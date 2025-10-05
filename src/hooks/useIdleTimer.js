/**
 * ============================================
 * HOOK PERSONNALISÉ - GESTION DE L'INACTIVITÉ
 * ============================================
 * Détecte l'inactivité de l'utilisateur et déclenche
 * une action (déconnexion) après un délai configurable
 */

import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook pour gérer la déconnexion automatique après inactivité
 * @param {Function} onIdle - Fonction appelée lors de l'inactivité
 * @param {number} idleTime - Temps d'inactivité en millisecondes
 * @param {boolean} isEnabled - Active/désactive le timer
 */
const useIdleTimer = (onIdle, idleTime, isEnabled = true) => {
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);

  // ============================================
  // RÉINITIALISATION DU TIMER
  // ============================================
  const resetTimer = useCallback(() => {
    // Nettoyer les timers existants
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Redémarrer le timer si activé
    if (isEnabled && onIdle) {
      timeoutRef.current = setTimeout(() => {
        onIdle();
      }, idleTime);
    }
  }, [onIdle, idleTime, isEnabled]);

  // ============================================
  // GESTIONNAIRE D'ÉVÉNEMENTS
  // ============================================
  const handleActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  // ============================================
  // EFFET PRINCIPAL
  // ============================================
  useEffect(() => {
    // Événements à surveiller (défini dans l'effet pour éviter les warnings)
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'keydown'
    ];

    if (!isEnabled) {
      // Nettoyer les timers si désactivé
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      return;
    }

    // Démarrer le timer initial
    resetTimer();

    // Ajouter les écouteurs d'événements
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Nettoyage lors du démontage
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      
      // Nettoyer les timers
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnabled, handleActivity]);

  return { resetTimer };
};

export default useIdleTimer;
