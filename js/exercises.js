// =============================================
// Zeny Fitness - Exercise Database & Templates
// =============================================

const EXERCISE_DATABASE = {
    'peito': {
        name: 'Peito',
        icon: '🫁',
        exercises: [
            'Supino Reto com Barra',
            'Supino Reto com Halteres',
            'Supino Inclinado com Barra',
            'Supino Inclinado com Halteres',
            'Supino Declinado com Barra',
            'Supino Declinado com Halteres',
            'Crucifixo Reto',
            'Crucifixo Inclinado',
            'Crucifixo Declinado',
            'Crucifixo na Máquina (Peck Deck)',
            'Crossover na Polia Alta',
            'Crossover na Polia Média',
            'Crossover na Polia Baixa',
            'Flexão de Braço Tradicional',
            'Flexão de Braço Aberta',
            'Flexão de Braço Fechada',
            'Flexão Inclinada',
            'Flexão Declinada',
            'Chest Press na Máquina',
            'Pullover com Halter',
            'Pullover na Polia'
        ]
    },
    'costas': {
        name: 'Costas',
        icon: '🔙',
        exercises: [
            'Puxada Frente Pegada Aberta',
            'Puxada Frente Pegada Fechada',
            'Puxada Neutra',
            'Puxada Atrás',
            'Barra Fixa Pronada',
            'Barra Fixa Supinada',
            'Barra Fixa Neutra',
            'Remada Curvada com Barra',
            'Remada Curvada com Halteres',
            'Remada Unilateral com Halter',
            'Remada Baixa na Polia',
            'Remada Cavalinho (T-Bar)',
            'Remada na Máquina',
            'Pulldown Unilateral',
            'Pullover na Polia Alta',
            'Levantamento Terra',
            'Levantamento Terra Romeno',
            'Deadlift Sumô'
        ]
    },
    'ombros': {
        name: 'Ombros',
        icon: '💪',
        exercises: [
            'Desenvolvimento com Barra',
            'Desenvolvimento com Halteres',
            'Desenvolvimento Arnold',
            'Desenvolvimento na Máquina',
            'Elevação Lateral com Halteres',
            'Elevação Lateral na Polia',
            'Elevação Frontal com Halteres',
            'Elevação Frontal com Barra',
            'Elevação Frontal na Polia',
            'Crucifixo Inverso com Halteres',
            'Crucifixo Inverso na Máquina',
            'Crucifixo Inverso na Polia',
            'Remada Alta com Barra',
            'Remada Alta na Polia',
            'Elevação Lateral Unilateral'
        ]
    },
    'biceps': {
        name: 'Bíceps',
        icon: '💪',
        exercises: [
            'Rosca Direta com Barra',
            'Rosca Direta com Halteres',
            'Rosca Alternada',
            'Rosca Simultânea',
            'Rosca Scott com Barra',
            'Rosca Scott na Máquina',
            'Rosca Concentrada',
            'Rosca Martelo',
            'Rosca Martelo Cruzada',
            'Rosca no Cabo',
            'Rosca 21',
            'Rosca Inversa',
            'Rosca Spider'
        ]
    },
    'triceps': {
        name: 'Tríceps',
        icon: '💪',
        exercises: [
            'Tríceps Pulley',
            'Tríceps Pulley com Corda',
            'Tríceps Testa com Barra',
            'Tríceps Testa com Halteres',
            'Tríceps Francês',
            'Tríceps Francês Unilateral',
            'Tríceps Banco',
            'Mergulho em Paralelas',
            'Tríceps Coice',
            'Tríceps na Máquina',
            'Flexão Fechada'
        ]
    },
    'pernas': {
        name: 'Pernas',
        icon: '🦵',
        exercises: [
            'Agachamento Livre',
            'Agachamento Frontal',
            'Agachamento Sumô',
            'Agachamento Hack',
            'Agachamento na Máquina',
            'Leg Press 45°',
            'Leg Press Horizontal',
            'Cadeira Extensora',
            'Mesa Flexora',
            'Cadeira Flexora',
            'Afundo',
            'Afundo Caminhando',
            'Afundo no Smith',
            'Passada',
            'Stiff',
            'Levantamento Terra Romeno',
            'Good Morning',
            'Elevação Pélvica (Hip Thrust)',
            'Glute Bridge',
            'Abdução de Quadril',
            'Adução de Quadril',
            'Step Up',
            'Avanço no Bosu'
        ]
    },
    'panturrilha': {
        name: 'Panturrilha',
        icon: '🦶',
        exercises: [
            'Elevação de Panturrilha em Pé',
            'Elevação de Panturrilha Sentado',
            'Panturrilha no Leg Press',
            'Panturrilha Unilateral',
            'Panturrilha no Smith'
        ]
    },
    'abdomen': {
        name: 'Abdômen / Core',
        icon: '🎯',
        exercises: [
            'Abdominal Tradicional',
            'Abdominal Infra',
            'Abdominal Supra',
            'Abdominal Bicicleta',
            'Abdominal Obliquo',
            'Elevação de Pernas',
            'Elevação de Pernas na Barra',
            'Prancha Isométrica',
            'Prancha Lateral',
            'Abdominal na Polia',
            'Abdominal na Máquina',
            'Ab Wheel',
            'Hollow Body',
            'Russian Twist'
        ]
    },
    'cardio': {
        name: 'Cardio',
        icon: '❤️',
        exercises: [
            'Esteira',
            'Bicicleta Ergométrica',
            'Bicicleta Spinning',
            'Elíptico',
            'Escada (Stairmaster)',
            'Remo Ergométrico',
            'Air Bike'
        ]
    },
    'funcional': {
        name: 'Funcional',
        icon: '🏃',
        exercises: [
            'Burpee',
            'Kettlebell Swing',
            'Kettlebell Goblet Squat',
            'Battle Rope',
            'Box Jump',
            'Wall Ball',
            'Farmer Walk',
            'Medicine Ball Slam',
            'Corrida Shuttle',
            'Agachamento com Bola'
        ]
    }
};

const WORKOUT_TEMPLATES = {
    'fullbody': {
        name: 'Full Body',
        description: '2-3x por semana - Corpo todo no mesmo dia',
        frequency: '2-3x',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6.5 6.5h11M6.5 17.5h11M3 12h3m12 0h3M7.5 12a2 2 0 0 1-2-2V8.5a2 2 0 0 1 2-2 2 2 0 0 1 2 2V10a2 2 0 0 1-2 2zm9 0a2 2 0 0 0 2-2V8.5a2 2 0 0 0-2-2 2 2 0 0 0-2 2V10a2 2 0 0 0 2 2zm-9 0a2 2 0 0 0-2 2v1.5a2 2 0 0 0 2 2 2 2 0 0 0 2-2V14a2 2 0 0 0-2-2zm9 0a2 2 0 0 1 2 2v1.5a2 2 0 0 1-2 2 2 2 0 0 1-2-2V14a2 2 0 0 1 2-2z"/></svg>',
        days: [
            {
                name: 'Treino Único',
                letter: 'A',
                exercises: [
                    { name: 'Supino Reto com Barra', sets: 4, reps: 10, category: 'peito' },
                    { name: 'Puxada Frente Pegada Aberta', sets: 4, reps: 10, category: 'costas' },
                    { name: 'Agachamento Livre', sets: 4, reps: 10, category: 'pernas' },
                    { name: 'Desenvolvimento com Halteres', sets: 3, reps: 12, category: 'ombros' },
                    { name: 'Rosca Direta com Barra', sets: 3, reps: 12, category: 'biceps' },
                    { name: 'Tríceps Pulley', sets: 3, reps: 12, category: 'triceps' },
                    { name: 'Prancha Isométrica', sets: 3, reps: 30, category: 'abdomen' }
                ]
            }
        ]
    },
    'ab': {
        name: 'AB (Superior/Inferior)',
        description: '3-4x por semana - Divisão parte superior e inferior',
        frequency: '3-4x',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
        days: [
            {
                name: 'Parte Superior',
                letter: 'A',
                exercises: [
                    { name: 'Supino Reto com Barra', sets: 4, reps: 10, category: 'peito' },
                    { name: 'Crucifixo Reto', sets: 3, reps: 12, category: 'peito' },
                    { name: 'Remada Curvada com Barra', sets: 4, reps: 10, category: 'costas' },
                    { name: 'Puxada Frente Pegada Aberta', sets: 3, reps: 12, category: 'costas' },
                    { name: 'Elevação Lateral com Halteres', sets: 3, reps: 15, category: 'ombros' },
                    { name: 'Rosca Direta com Barra', sets: 3, reps: 12, category: 'biceps' },
                    { name: 'Tríceps Testa com Barra', sets: 3, reps: 12, category: 'triceps' },
                    { name: 'Abdominal Supra', sets: 3, reps: 20, category: 'abdomen' }
                ]
            },
            {
                name: 'Parte Inferior',
                letter: 'B',
                exercises: [
                    { name: 'Agachamento Livre', sets: 4, reps: 10, category: 'pernas' },
                    { name: 'Leg Press 45°', sets: 4, reps: 12, category: 'pernas' },
                    { name: 'Stiff', sets: 4, reps: 10, category: 'pernas' },
                    { name: 'Mesa Flexora', sets: 3, reps: 12, category: 'pernas' },
                    { name: 'Elevação Pélvica (Hip Thrust)', sets: 3, reps: 15, category: 'pernas' },
                    { name: 'Elevação de Panturrilha em Pé', sets: 4, reps: 15, category: 'panturrilha' },
                    { name: 'Prancha Isométrica', sets: 3, reps: 45, category: 'abdomen' }
                ]
            }
        ]
    },
    'abc': {
        name: 'ABC',
        description: '4-5x por semana - Divisão clássica em 3 treinos',
        frequency: '4-5x',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="8" width="4" height="13" rx="1"/><rect x="17" y="4" width="4" height="17" rx="1"/></svg>',
        days: [
            {
                name: 'Peito + Tríceps',
                letter: 'A',
                exercises: [
                    { name: 'Supino Reto com Barra', sets: 4, reps: 10, category: 'peito' },
                    { name: 'Supino Inclinado com Halteres', sets: 4, reps: 10, category: 'peito' },
                    { name: 'Crossover na Polia Alta', sets: 3, reps: 12, category: 'peito' },
                    { name: 'Tríceps Pulley', sets: 4, reps: 12, category: 'triceps' },
                    { name: 'Tríceps Testa com Barra', sets: 3, reps: 12, category: 'triceps' },
                    { name: 'Tríceps Francês', sets: 3, reps: 12, category: 'triceps' }
                ]
            },
            {
                name: 'Costas + Bíceps',
                letter: 'B',
                exercises: [
                    { name: 'Puxada Frente Pegada Aberta', sets: 4, reps: 10, category: 'costas' },
                    { name: 'Remada Curvada com Barra', sets: 4, reps: 10, category: 'costas' },
                    { name: 'Remada Baixa na Polia', sets: 3, reps: 12, category: 'costas' },
                    { name: 'Rosca Direta com Barra', sets: 4, reps: 10, category: 'biceps' },
                    { name: 'Rosca Alternada', sets: 3, reps: 12, category: 'biceps' },
                    { name: 'Rosca Martelo', sets: 3, reps: 12, category: 'biceps' }
                ]
            },
            {
                name: 'Pernas + Ombros',
                letter: 'C',
                exercises: [
                    { name: 'Agachamento Livre', sets: 4, reps: 10, category: 'pernas' },
                    { name: 'Leg Press 45°', sets: 4, reps: 12, category: 'pernas' },
                    { name: 'Cadeira Extensora', sets: 3, reps: 12, category: 'pernas' },
                    { name: 'Stiff', sets: 4, reps: 10, category: 'pernas' },
                    { name: 'Mesa Flexora', sets: 3, reps: 12, category: 'pernas' },
                    { name: 'Desenvolvimento com Halteres', sets: 4, reps: 10, category: 'ombros' },
                    { name: 'Elevação Lateral com Halteres', sets: 3, reps: 15, category: 'ombros' },
                    { name: 'Elevação de Panturrilha Sentado', sets: 4, reps: 15, category: 'panturrilha' }
                ]
            }
        ]
    },
    'abcd': {
        name: 'ABCD',
        description: '5-6x por semana - Divisão avançada em 4 treinos',
        frequency: '5-6x',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
        days: [
            {
                name: 'Peito',
                letter: 'A',
                exercises: [
                    { name: 'Supino Reto com Barra', sets: 4, reps: 10, category: 'peito' },
                    { name: 'Supino Inclinado com Halteres', sets: 4, reps: 10, category: 'peito' },
                    { name: 'Crucifixo Reto', sets: 3, reps: 12, category: 'peito' },
                    { name: 'Crossover na Polia Alta', sets: 3, reps: 15, category: 'peito' }
                ]
            },
            {
                name: 'Costas',
                letter: 'B',
                exercises: [
                    { name: 'Puxada Frente Pegada Aberta', sets: 4, reps: 10, category: 'costas' },
                    { name: 'Remada Curvada com Barra', sets: 4, reps: 10, category: 'costas' },
                    { name: 'Remada Cavalinho (T-Bar)', sets: 3, reps: 12, category: 'costas' },
                    { name: 'Pullover na Polia Alta', sets: 3, reps: 12, category: 'costas' }
                ]
            },
            {
                name: 'Pernas',
                letter: 'C',
                exercises: [
                    { name: 'Agachamento Livre', sets: 4, reps: 10, category: 'pernas' },
                    { name: 'Leg Press 45°', sets: 4, reps: 12, category: 'pernas' },
                    { name: 'Stiff', sets: 4, reps: 10, category: 'pernas' },
                    { name: 'Mesa Flexora', sets: 3, reps: 12, category: 'pernas' },
                    { name: 'Elevação Pélvica (Hip Thrust)', sets: 3, reps: 15, category: 'pernas' },
                    { name: 'Panturrilha no Leg Press', sets: 4, reps: 15, category: 'panturrilha' }
                ]
            },
            {
                name: 'Ombros + Braços',
                letter: 'D',
                exercises: [
                    { name: 'Desenvolvimento com Halteres', sets: 4, reps: 10, category: 'ombros' },
                    { name: 'Elevação Lateral com Halteres', sets: 3, reps: 15, category: 'ombros' },
                    { name: 'Crucifixo Inverso com Halteres', sets: 3, reps: 15, category: 'ombros' },
                    { name: 'Rosca Direta com Barra', sets: 4, reps: 10, category: 'biceps' },
                    { name: 'Rosca Martelo', sets: 3, reps: 12, category: 'biceps' },
                    { name: 'Tríceps Pulley', sets: 4, reps: 12, category: 'triceps' },
                    { name: 'Tríceps Francês', sets: 3, reps: 12, category: 'triceps' }
                ]
            }
        ]
    },
    'ppl': {
        name: 'Push/Pull/Legs',
        description: '5-6x por semana - Divisão por movimento',
        frequency: '5-6x',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>',
        days: [
            {
                name: 'Push (Empurrar)',
                letter: 'A',
                exercises: [
                    { name: 'Supino Reto com Barra', sets: 4, reps: 10, category: 'peito' },
                    { name: 'Supino Inclinado com Halteres', sets: 4, reps: 10, category: 'peito' },
                    { name: 'Desenvolvimento com Halteres', sets: 4, reps: 10, category: 'ombros' },
                    { name: 'Elevação Lateral com Halteres', sets: 3, reps: 15, category: 'ombros' },
                    { name: 'Tríceps Pulley', sets: 4, reps: 12, category: 'triceps' },
                    { name: 'Tríceps Testa com Barra', sets: 3, reps: 12, category: 'triceps' }
                ]
            },
            {
                name: 'Pull (Puxar)',
                letter: 'B',
                exercises: [
                    { name: 'Puxada Frente Pegada Aberta', sets: 4, reps: 10, category: 'costas' },
                    { name: 'Remada Curvada com Barra', sets: 4, reps: 10, category: 'costas' },
                    { name: 'Remada Baixa na Polia', sets: 3, reps: 12, category: 'costas' },
                    { name: 'Rosca Direta com Barra', sets: 4, reps: 10, category: 'biceps' },
                    { name: 'Rosca Martelo', sets: 3, reps: 12, category: 'biceps' },
                    { name: 'Crucifixo Inverso com Halteres', sets: 3, reps: 15, category: 'ombros' }
                ]
            },
            {
                name: 'Legs (Pernas)',
                letter: 'C',
                exercises: [
                    { name: 'Agachamento Livre', sets: 4, reps: 10, category: 'pernas' },
                    { name: 'Leg Press 45°', sets: 4, reps: 12, category: 'pernas' },
                    { name: 'Cadeira Extensora', sets: 3, reps: 12, category: 'pernas' },
                    { name: 'Stiff', sets: 4, reps: 10, category: 'pernas' },
                    { name: 'Mesa Flexora', sets: 3, reps: 12, category: 'pernas' },
                    { name: 'Elevação Pélvica (Hip Thrust)', sets: 3, reps: 15, category: 'pernas' },
                    { name: 'Elevação de Panturrilha em Pé', sets: 4, reps: 15, category: 'panturrilha' },
                    { name: 'Prancha Isométrica', sets: 3, reps: 45, category: 'abdomen' }
                ]
            }
        ]
    },
    'custom': {
        name: 'Personalizado',
        description: 'Crie sua própria rotina do zero',
        frequency: 'Variável',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
        days: []
    }
};

// Helper function to get exercise category
function getExerciseCategory(exerciseName) {
    for (const [categoryKey, category] of Object.entries(EXERCISE_DATABASE)) {
        if (category.exercises.includes(exerciseName)) {
            return categoryKey;
        }
    }
    return null;
}

// Helper function to search exercises
function searchExercises(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();

    for (const [categoryKey, category] of Object.entries(EXERCISE_DATABASE)) {
        for (const exercise of category.exercises) {
            if (exercise.toLowerCase().includes(lowerQuery)) {
                results.push({
                    name: exercise,
                    category: categoryKey,
                    categoryName: category.name,
                    icon: category.icon
                });
            }
        }
    }

    return results;
}

// Export for use in app.js
window.EXERCISE_DATABASE = EXERCISE_DATABASE;
window.WORKOUT_TEMPLATES = WORKOUT_TEMPLATES;
window.getExerciseCategory = getExerciseCategory;
window.searchExercises = searchExercises;
