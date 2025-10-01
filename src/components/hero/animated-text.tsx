import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import Typography from '../ui/typography';

const messages = [
  { text: 'friendly.', color: '#feb29c' },
  { text: 'right to the point.', color: '#356ad2' },
];

export default function AnimatedText() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const currentMessage = messages[index];

  return (
    <div className="w-full h-10 sm:h-14 md:h-16 lg:h-20 overflow-hidden relative">
      <AnimatePresence>
        <motion.div
          key={currentMessage.text + index}
          initial={{ y: -120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          className="absolute w-full "
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 60,
            duration: 0.5,
          }}
        >
          <Typography
            size={'h1'}
            className="font-whyte whitespace-nowrap"
            style={{
              color: currentMessage.color,
            }}
          >
            {currentMessage.text}
          </Typography>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
