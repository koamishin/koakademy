/** Shared animation constants from the SmoothUI registry. */
export const SPRING_DEFAULT = {
    type: "spring" as const,
    duration: 0.25,
    bounce: 0.1,
};

export const SPRING_SNAPPY = {
    type: "spring" as const,
    duration: 0.2,
    bounce: 0,
};

export const DURATION_INSTANT = { duration: 0 };
