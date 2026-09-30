import { CONSTANTS } from "clink-components";

const { white, lightGreen, clinkRed, teal2, clinkGreenDark, darkerRed, bostonRed, christmasSilver, darkGray } = CONSTANTS.colors.general;
const classes = (variant) => ({
    baseStyles: {
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 14px',
        backgroundColor: variant === 'red' ? clinkRed : lightGreen,
        color: white,
        borderRadius: '999px',
        fontSize: '1rem',
        fontWeight: 600,
        lineHeight: 1.5,
        textTransform: 'none',
        cursor: 'pointer',
        border: 'none',
        boxShadow: 'none',
        transition: 'background-color 200ms ease',
        '&:hover': {
            backgroundColor: variant === 'red' ? darkerRed : teal2,
        },
        '&:focus': {
            outline: 'none',
            boxShadow: '0 0 0 3px rgba(78, 197, 182, 0.4)',
        },
        '&:active': {
            backgroundColor: variant === 'red' ? bostonRed : clinkGreenDark,
        },
    },

    disabledStyles: {
        pointerEvents: 'none',
        cursor: 'not-allowed',
        backgroundColor: christmasSilver,
        color: darkGray,
        opacity: 1,
    },

    buttonContentStyles: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
    }
})

export default classes
