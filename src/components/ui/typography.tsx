import React, { type ElementType } from 'react';

import { type VariantProps, cva } from 'class-variance-authority';

const typographyVariants = cva('', {
  variants: {
    size: {
      h1: 'text-4xl sm:text-5xl md:text-[64px] md:!leading-[1] tracking-tight',
      h2: 'text-3xl sm:text-4xl md:text-5xl !leading-[1.2] tracking-tight',
      h3: 'text-2xl sm:text-3xl !leading-[1.2] tracking-tight',
      h4: 'text-xl sm:text-2xl !leading-[1.2] tracking-tight',
      h5: 'text-lg sm:text-xl !leading-[1.2] tracking-tight',
      xl: 'text-xl',
      lg: 'text-lg',
      md: 'text-base',
      sm: 'text-sm',
      xs: 'text-xs',
    },
    weight: {
      bold: 'font-bold',
      semibold: 'font-semibold',
      normal: 'font-normal',
      light: 'font-light',
      extralight: 'font-extralight',
    },
    textColor: {
      foreground: 'text-foreground',
      primary: 'text-primary',
      secondary: 'text-secondary',
      white: 'text-white',
      gray: 'text-slate-500',
    },
  },
  defaultVariants: {
    size: 'md',
    weight: 'normal',
    textColor: 'foreground',
  },
});

type AsProp<T extends ElementType> = {
  as?: T;
};

type TypographyProps<T extends ElementType> = AsProp<T> &
  React.ComponentPropsWithoutRef<T> &
  VariantProps<typeof typographyVariants>;

const Typography = <T extends ElementType = 'p'>({
  as,
  className,
  size,
  weight,
  textColor,
  ...props
}: TypographyProps<T>) => {
  const Component = as ?? 'p';
  return (
    <Component
      className={`${typographyVariants({ size, weight, textColor })} ${
        className ?? ''
      }`}
      {...props}
    />
  );
};

export default Typography;
