/**
 * Tokens de diseño de Asadero Kikos (fuente única para index.html y admin.html).
 * Documentación: design-system/asadero-kikos/MASTER.md
 */
tailwind.config = {
    theme: {
        extend: {
            colors: {
                rojo: { DEFAULT: '#E91C01', oscuro: '#B81500' },
                naranja: '#FA6B02',
                amarillo: '#FED201',
                crema: '#FFF6E6',
                arena: '#F3E2C4',
                linea: '#9C7F6C', // Bordes de campos de formulario (contraste 3,5:1 sobre blanco)
                cafe: { DEFAULT: '#2A1206', suave: '#6B4A36' },
                whatsapp: { DEFAULT: '#0E7A3F', oscuro: '#0A6132' },
            },
            fontFamily: {
                sans: ['"Nunito Sans"', 'system-ui', 'sans-serif'],
                display: ['Anton', 'Impact', 'sans-serif'],
            },
            boxShadow: {
                calida: '0 10px 30px -12px rgba(42, 18, 6, 0.25)',
                'calida-lg': '0 24px 50px -20px rgba(42, 18, 6, 0.35)',
            },
            keyframes: {
                marquesina: {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(-50%)' },
                },
                girar: {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                },
            },
            animation: {
                marquesina: 'marquesina 30s linear infinite',
                girar: 'girar 24s linear infinite',
            },
        },
    },
};
