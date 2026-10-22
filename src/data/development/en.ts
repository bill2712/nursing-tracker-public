import type { DevMonth } from './types';

const en: DevMonth[] = [
  {
    month: 0,
    summary: 'Welcome to the world! In the first weeks your baby is adjusting to life outside the womb, learning to feed and getting to know your voice, smell and face.',
    abilities: [
      { id: 'm0-a-1', title: 'Rooting reflex', text: 'When you stroke their cheek, your baby turns towards your touch and opens their mouth, looking for the breast or bottle.' },
      { id: 'm0-a-2', title: 'Startle (Moro) reflex', text: 'A loud noise or a feeling of falling makes your baby fling their arms out and then pull them back in.' },
      { id: 'm0-a-3', title: 'Grasp reflex', text: 'Your baby grips a finger tightly when you touch their palm.' },
      { id: 'm0-a-4', title: 'Sees faces up close', text: 'Newborns see best about 20–30 cm (8–12 in) away — roughly the distance to your face during a feed.' },
      { id: 'm0-a-5', title: 'Knows your voice', text: 'Your baby may calm or turn towards the familiar voices they heard in the womb.' }
    ],
    challenges: [
      { id: 'm0-h-1', title: 'Lots of crying', text: 'Crying is your baby’s only way to communicate hunger, a wet diaper, being too hot or cold, or needing comfort.' },
      { id: 'm0-h-2', title: 'Irregular sleep', text: 'Day–night confusion is common. Most newborns wake every 2–4 hours to feed.' },
      { id: 'm0-h-3', title: 'Newborn jaundice', text: 'Yellow skin or eyes in the first days is common, but tell your midwife or doctor so they can check whether treatment is needed.' }
    ],
    exercises: [
      { id: 'm0-e-1', title: 'Tummy time', text: 'While awake and supervised, lay your baby on your chest or a firm flat surface for 1–2 minutes a few times a day to strengthen neck muscles.' },
      { id: 'm0-e-2', title: 'High-contrast pictures', text: 'Hold black-and-white cards 20–30 cm from your baby’s face and move them slowly to encourage tracking.' },
      { id: 'm0-e-3', title: 'Skin-to-skin contact', text: 'Holding your baby in just a diaper against your bare chest helps steady their breathing, heart rate and temperature, and supports bonding and breastfeeding.' },
      { id: 'm0-e-4', title: 'Gentle massage', text: 'After a bath, gently stroke your baby’s arms, legs and back to help them relax.' }
    ],
    care: [
      { id: 'm0-c-1', title: 'Umbilical cord care', text: 'Keep the stump clean and dry and fold the diaper below it. It usually falls off within 1–3 weeks. Watch for redness, swelling or a bad smell.' },
      { id: 'm0-c-2', title: 'Sponge baths first', text: 'Until the cord falls off, a sponge bath is easiest. Keep the water around 37–38°C (98–100°F), the room warm and baths short.' },
      { id: 'm0-c-3', title: 'Count wet diapers', text: 'From about day 5–6, expect at least 6 heavy wet diapers in 24 hours — a good sign your baby is getting enough milk.' },
      { id: 'm0-c-4', title: 'Safe sleep', text: 'Always put your baby to sleep on their back, on a firm flat mattress with no pillows, bumpers, blankets or soft toys, in your room.' },
      { id: 'm0-c-5', title: 'Burping', text: 'Burp your baby during and after feeds to reduce wind and spit-up.' }
    ],
    redFlags: [
      'Feeding poorly, or fewer than 6 wet diapers a day after the first week',
      'A temperature of 38°C (100.4°F) or higher — seek medical help urgently',
      'Yellow skin that spreads or deepens, or appears in the first 24 hours',
      'Being very hard to wake, floppy, or breathing fast or with effort'
    ]
  },
  {
    month: 1,
    summary: 'Your baby is awake for a little longer each day, starts to lift their head briefly and loves looking at faces.',
    abilities: [
      { id: 'm1-a-1', title: 'Lifts head briefly', text: 'During tummy time your baby can raise their head for a moment.' },
      { id: 'm1-a-2', title: 'Prefers faces', text: 'Your baby would rather look at your face than at objects.' },
      { id: 'm1-a-3', title: 'Responds to sound', text: 'Your baby startles, quiets or turns at sounds and voices.' },
      { id: 'm1-a-4', title: 'Brings hands near face', text: 'Arm movements become smoother and hands often end up near the mouth.' }
    ],
    challenges: [
      { id: 'm1-h-1', title: 'Growth spurts', text: 'Around 2–3 and 6 weeks many babies feed much more often and are fussier for a few days.' },
      { id: 'm1-h-2', title: 'Evening fussiness', text: 'Crying often peaks around 6 weeks, usually in the evening. Inconsolable crying for more than 3 hours a day may be colic — mention it to your doctor.' }
    ],
    exercises: [
      { id: 'm1-e-1', title: 'More tummy time', text: 'Build up to 3–5 minutes at a time, several times a day. Lie down face-to-face to keep your baby interested.' },
      { id: 'm1-e-2', title: 'Talk and sing', text: 'Use a warm, sing-song voice and respond to every little sound your baby makes.' },
      { id: 'm1-e-3', title: 'Follow the toy', text: 'Move a bright toy slowly from side to side about 30 cm away so your baby can follow it with their eyes.' }
    ],
    care: [
      { id: 'm1-c-1', title: 'Cradle cap', text: 'Yellow, scaly patches on the scalp are harmless. Soften them with a little baby oil and gently brush; do not pick.' },
      { id: 'm1-c-2', title: 'Trim nails', text: 'Baby nails grow fast and scratch. File or trim them while your baby sleeps.' },
      { id: 'm1-c-3', title: 'Day and night cues', text: 'Keep days bright with normal noise and nights dark and quiet to help your baby learn the difference.' }
    ],
    redFlags: [
      'Not responding to loud sounds',
      'Not focusing on faces at all',
      'Feeding poorly or not gaining weight',
      'Seeming very stiff or very floppy'
    ]
  },
  {
    month: 2,
    summary: 'The first real smiles appear! Your baby is more alert, coos back at you and holds their head up better.',
    abilities: [
      { id: 'm2-a-1', title: 'Social smile', text: 'Your baby smiles at you on purpose, not just as a reflex.' },
      { id: 'm2-a-2', title: 'Coos', text: 'Makes sounds other than crying, such as “ooh” and “aah”.' },
      { id: 'm2-a-3', title: 'Holds head up on tummy', text: 'Can lift their head to about 45 degrees during tummy time.' },
      { id: 'm2-a-4', title: 'Watches you move', text: 'Follows you with their eyes as you move around.' },
      { id: 'm2-a-5', title: 'Calms when comforted', text: 'Settles when picked up, spoken to or rocked.' }
    ],
    challenges: [
      { id: 'm2-h-1', title: 'Wants company', text: 'Many babies protest when put down while awake and want to be talked to and held.' }
    ],
    exercises: [
      { id: 'm2-e-1', title: 'Back-and-forth “chats”', text: 'When your baby coos, copy the sound and pause so they can “answer” — the start of conversation.' },
      { id: 'm2-e-2', title: 'Play gym', text: 'Lay your baby under a play gym so they can kick and swipe at hanging toys.' },
      { id: 'm2-e-3', title: 'Something to hold', text: 'Place a light rattle in their hand and see whether they hold it briefly.' }
    ],
    care: [
      { id: 'm2-c-1', title: 'First vaccines', text: 'Many countries offer the first vaccines around 2 months. A mild fever, sleepiness or a sore leg for a day or two is common.' },
      { id: 'm2-c-2', title: 'Bedtime routine', text: 'Start a simple, calming routine such as bath, massage, feed, song, lights out.' }
    ],
    redFlags: [
      'Not smiling at people',
      'Not watching things as they move',
      'Not bringing hands to mouth',
      'Not holding head up when pushing up on tummy'
    ]
  },
  {
    month: 3,
    summary: 'Your baby gains more control of their body, discovers their hands and may laugh out loud for the first time.',
    abilities: [
      { id: 'm3-a-1', title: 'Pushes up on forearms', text: 'During tummy time your baby lifts their head and chest, leaning on their forearms.' },
      { id: 'm3-a-2', title: 'Discovers hands', text: 'Watches their hands, brings them together and sucks on them.' },
      { id: 'm3-a-3', title: 'Laughs and squeals', text: 'Giggles when you play, tickle gently or make funny faces.' },
      { id: 'm3-a-4', title: 'Head steadier', text: 'Holds their head more steadily when held upright.' }
    ],
    challenges: [
      { id: 'm3-h-1', title: 'Everything goes in the mouth', text: 'Lots of drooling and mouthing is normal — it is how babies explore. It is not always a sign of teething.' }
    ],
    exercises: [
      { id: 'm3-e-1', title: 'Side-lying play', text: 'Lay your baby on their side and offer a toy just out of reach to encourage rolling.' },
      { id: 'm3-e-2', title: 'Textures and sounds', text: 'Offer safe toys with different textures and gentle sounds.' },
      { id: 'm3-e-3', title: 'Songs with actions', text: 'Sing nursery rhymes with hand movements and pauses for your baby to react.' }
    ],
    care: [
      { id: 'm3-c-1', title: 'Drool rash', text: 'Pat the chin dry often and use a bib. A thin layer of barrier cream can protect irritated skin.' },
      { id: 'm3-c-2', title: 'Check the sleep space', text: 'Remove cords, ribbons and small objects your baby could grab as they become more active.' }
    ],
    redFlags: [
      'Not following moving objects with their eyes',
      'Not smiling or making sounds',
      'Not holding their head up during tummy time',
      'Not responding to sounds'
    ]
  },
  {
    month: 4,
    summary: 'A big month for movement: rolling and reaching begin — and sleep may change too.',
    abilities: [
      { id: 'm4-a-1', title: 'Rolls from tummy to back', text: 'Many babies start rolling, usually from tummy to back first.' },
      { id: 'm4-a-2', title: 'Reaches and grabs', text: 'Reaches for a toy with one hand and brings it to their mouth.' },
      { id: 'm4-a-3', title: 'Holds head steady', text: 'Holds their head steady without support when you hold them.' },
      { id: 'm4-a-4', title: 'Pushes up on hands', text: 'Pushes up onto straight arms during tummy time.' },
      { id: 'm4-a-5', title: 'Makes sounds back', text: 'Coos and babbles back when you talk to them.' }
    ],
    challenges: [
      { id: 'm4-h-1', title: 'The “4-month sleep regression”', text: 'Sleep cycles become more adult-like, so a baby who slept well may wake more often for 2–6 weeks. It passes.' },
      { id: 'm4-h-2', title: 'Distracted feeding', text: 'Babies become so curious that they stop and look around during feeds.' }
    ],
    exercises: [
      { id: 'm4-e-1', title: 'Floor time', text: 'Give plenty of time on a play mat rather than in bouncers and car seats, with a toy just out of reach.' },
      { id: 'm4-e-2', title: 'Cross the middle', text: 'Offer toys on one side for the opposite hand to reach — great for coordination.' },
      { id: 'm4-e-3', title: 'Gentle airplane', text: 'Lift your baby slowly and gently while supporting them well; many love the movement.' }
    ],
    care: [
      { id: 'm4-c-1', title: 'Stop swaddling', text: 'As soon as your baby shows signs of rolling, stop swaddling with arms in. Switch to a sleeping bag with arms free.' },
      { id: 'm4-c-2', title: 'Lower the crib', text: 'Lower the crib mattress as your baby becomes more active.' },
      { id: 'm4-c-3', title: 'Calm feeds', text: 'Feed in a quiet, dim room if your baby is easily distracted. If growth is on track, you do not need to force extra milk.' }
    ],
    redFlags: [
      'Not holding head steady when held',
      'Not cooing or making sounds',
      'Not bringing things to their mouth',
      'Not pushing down with legs when feet are placed on a firm surface'
    ]
  },
  {
    month: 6,
    summary: 'Half a year! Many babies are ready for solid food, start to sit with support and babble with repeated sounds.',
    abilities: [
      { id: 'm6-a-1', title: 'Sits with support', text: 'Sits leaning on their hands or with support; some sit alone briefly by 7 months.' },
      { id: 'm6-a-2', title: 'Rolls both ways', text: 'Rolls from back to tummy and tummy to back.' },
      { id: 'm6-a-3', title: 'Passes toys hand to hand', text: 'Moves a toy from one hand to the other.' },
      { id: 'm6-a-4', title: 'Babbles', text: 'Makes sounds like “ba-ba”, “ma-ma” and “da-da” (without meaning yet).' },
      { id: 'm6-a-5', title: 'Knows familiar people', text: 'Recognises familiar faces and may be wary of strangers.' }
    ],
    challenges: [
      { id: 'm6-h-1', title: 'Stranger wariness', text: 'Your baby may cry with new people or when you leave the room. It shows a healthy attachment.' },
      { id: 'm6-h-2', title: 'Teething', text: 'First teeth usually come between 6 and 10 months and can bring drooling, chewing and fussiness. A high fever is not caused by teething.' }
    ],
    exercises: [
      { id: 'm6-e-1', title: 'Share books', text: 'Look at board or cloth books with bright pictures and textures together every day.' },
      { id: 'm6-e-2', title: 'Peek-a-boo', text: 'Hiding and reappearing teaches that things still exist when out of sight.' },
      { id: 'm6-e-3', title: 'Getting ready to crawl', text: 'Place toys just out of reach during tummy time to encourage pivoting and shuffling.' }
    ],
    care: [
      { id: 'm6-c-1', title: 'Start solid foods', text: 'Around 6 months, offer iron-rich foods such as iron-fortified cereal, meat, fish, beans or lentils, alongside breast milk or formula.' },
      { id: 'm6-c-2', title: 'Brush first teeth', text: 'Clean teeth twice a day with a soft baby toothbrush and a smear (rice-grain amount) of fluoride toothpaste.' },
      { id: 'm6-c-3', title: 'Practise with a cup', text: 'Offer small sips of water from an open or free-flow cup with meals.' }
    ],
    redFlags: [
      'Not trying to reach for things',
      'Not rolling over or not laughing',
      'Not responding to sounds or making vowel sounds',
      'Seeming very stiff or very floppy'
    ]
  },
  {
    month: 9,
    summary: 'On the move! Crawling, pulling to stand and picking up tiny things — time to babyproof your home.',
    abilities: [
      { id: 'm9-a-1', title: 'Sits without support', text: 'Sits steadily on their own and reaches for toys while sitting.' },
      { id: 'm9-a-2', title: 'Crawls or scoots', text: 'Most babies crawl on hands and knees; some bottom-shuffle or commando-crawl instead.' },
      { id: 'm9-a-3', title: 'Pulls to stand', text: 'Pulls up on furniture and may cruise a few steps.' },
      { id: 'm9-a-4', title: 'Pincer grasp', text: 'Picks up small pieces of food between thumb and finger.' },
      { id: 'm9-a-5', title: 'Responds to name', text: 'Looks when you call their name and understands “no”.' }
    ],
    challenges: [
      { id: 'm9-h-1', title: 'Separation anxiety', text: 'Clinginess peaks; your baby may cry as soon as you leave the room. Short goodbyes and a reliable return help.' },
      { id: 'm9-h-2', title: 'Practising at night', text: 'New skills like standing can disrupt sleep as babies practise in the crib.' }
    ],
    exercises: [
      { id: 'm9-e-1', title: 'Finger foods', text: 'Offer soft pieces such as steamed carrot sticks, banana or toast fingers for self-feeding.' },
      { id: 'm9-e-2', title: 'Wave and clap', text: 'Practise waving bye-bye, clapping and simple gestures together.' },
      { id: 'm9-e-3', title: 'In and out', text: 'Give a box and some blocks: show how to put them in and tip them out.' }
    ],
    care: [
      { id: 'm9-c-1', title: 'Babyproof the home', text: 'Use cupboard locks, socket covers and stair gates; anchor furniture; move cords, medicines and small objects out of reach.' },
      { id: 'm9-c-2', title: 'Lowest crib setting', text: 'Once your baby can pull to stand, set the crib mattress to its lowest position.' },
      { id: 'm9-c-3', title: 'Calm limits', text: 'When something is dangerous, say “no” calmly and firmly and move your baby away.' }
    ],
    redFlags: [
      'Not sitting with help or bearing weight on legs with support',
      'Not babbling (“mama”, “baba”, “dada”)',
      'Not responding to their own name',
      'Not looking where you point, or not passing toys between hands'
    ]
  },
  {
    month: 12,
    summary: 'Happy first birthday! Your baby becomes a toddler: first steps, first words and lots of copying.',
    abilities: [
      { id: 'm12-a-1', title: 'Cruises or walks', text: 'Walks holding furniture or your hand; some walk alone. Walking by about 15–18 months is normal.' },
      { id: 'm12-a-2', title: 'First words', text: 'Says “mama” or “dada” with meaning and maybe one or two other words.' },
      { id: 'm12-a-3', title: 'Waves bye-bye', text: 'Uses gestures such as waving, pointing and shaking the head.' },
      { id: 'm12-a-4', title: 'Copies you', text: 'Imitates everyday actions like talking on the phone or wiping the table.' },
      { id: 'm12-a-5', title: 'Finds hidden things', text: 'Looks for a toy after watching you hide it.' }
    ],
    challenges: [
      { id: 'm12-h-1', title: 'Big feelings', text: 'A strong sense of self appears; frustration can turn into throwing and crying.' },
      { id: 'm12-h-2', title: 'Smaller appetite', text: 'Growth slows after the first year, so many toddlers eat less or become picky.' }
    ],
    exercises: [
      { id: 'm12-e-1', title: 'Push toys', text: 'A sturdy push-along toy or small chair helps practise walking.' },
      { id: 'm12-e-2', title: 'First scribbles', text: 'Offer chunky crayons and large paper.' },
      { id: 'm12-e-3', title: 'Shape sorting', text: 'Simple shape sorters and stacking cups build problem-solving.' }
    ],
    care: [
      { id: 'm12-c-1', title: 'Whole cow’s milk', text: 'From 12 months, whole (full-fat) cow’s milk can be the main milk drink; continue breastfeeding as long as you both wish.' },
      { id: 'm12-c-2', title: 'Move to a cup', text: 'Start replacing bottles with an open or free-flow cup to protect teeth.' },
      { id: 'm12-c-3', title: 'Gentle, clear limits', text: 'Keep rules simple and consistent. Calmly remove your child from the situation instead of shouting.' }
    ],
    redFlags: [
      'Not crawling or not standing when supported',
      'Not saying single words like “mama” or “dada”',
      'Not using gestures such as waving or pointing',
      'Losing skills they once had'
    ]
  },
  {
    month: 18,
    summary: 'A busy explorer who walks well, climbs everything and is learning new words every week — and the word “no”.',
    abilities: [
      { id: 'm18-a-1', title: 'Walks well', text: 'Walks steadily, may start to run and climbs onto furniture.' },
      { id: 'm18-a-2', title: 'Several words', text: 'Says at least 3 words besides “mama” and “dada”, and often many more.' },
      { id: 'm18-a-3', title: 'Points to show you', text: 'Points to show you something interesting and to ask for things.' },
      { id: 'm18-a-4', title: 'Uses a spoon', text: 'Tries to feed themselves with a spoon and drinks from a cup.' },
      { id: 'm18-a-5', title: 'Follows simple directions', text: 'Follows one-step instructions without gestures, like “give it to me”.' }
    ],
    challenges: [
      { id: 'm18-h-1', title: '“No!” and tantrums', text: 'Toddlers want independence but lack words, so meltdowns are common, especially when tired or hungry.' },
      { id: 'm18-h-2', title: 'Sleep changes', text: 'Separation anxiety, molars and new independence can make bedtime harder for a while.' }
    ],
    exercises: [
      { id: 'm18-e-1', title: 'Simple puzzles', text: 'Try chunky two- or three-piece puzzles.' },
      { id: 'm18-e-2', title: 'Little helper', text: 'Let your toddler help tidy toys or fetch a diaper — they love feeling useful.' },
      { id: 'm18-e-3', title: 'Two-step instructions', text: 'Practise requests like “get your shoes and bring them here”.' }
    ],
    care: [
      { id: 'm18-c-1', title: 'Handling tantrums', text: 'Keep your child safe, stay close and calm, and talk once they have settled.' },
      { id: 'm18-c-2', title: 'Offer limited choices', text: '“The red cup or the blue cup?” gives a sense of control without a battle.' },
      { id: 'm18-c-3', title: 'Plan to cut back on dummies', text: 'If your child uses a pacifier, start limiting it to sleep times.' }
    ],
    redFlags: [
      'Not walking',
      'Not pointing to show things to others',
      'Not copying others or not gaining new words',
      'Not noticing or minding when a caregiver leaves or returns'
    ]
  },
  {
    month: 24,
    summary: 'Words take off! Two-year-olds join words together, run and jump, and play pretend — while still learning to manage big feelings.',
    abilities: [
      { id: 'm24-a-1', title: 'Two-word phrases', text: 'Puts two words together, like “more milk”, and often knows 50 words or more.' },
      { id: 'm24-a-2', title: 'Runs and kicks', text: 'Runs, kicks a ball and walks up stairs holding on.' },
      { id: 'm24-a-3', title: 'Pretend play', text: 'Feeds a doll or pretends to cook — a sign of growing imagination.' },
      { id: 'm24-a-4', title: 'Points to pictures', text: 'Points to things in a book when you name them.' }
    ],
    challenges: [
      { id: 'm24-h-1', title: '“Mine!”', text: 'Sharing is hard at this age; that is normal. Taking turns comes later with practice.' },
      { id: 'm24-h-2', title: 'New fears', text: 'Fears of the dark, loud machines or big animals can appear suddenly.' }
    ],
    exercises: [
      { id: 'm24-e-1', title: 'Talk about books', text: 'Ask simple questions while reading: “Where is the dog?” “What is the cat doing?”' },
      { id: 'm24-e-2', title: 'Blocks and dough', text: 'Building towers and squishing play dough strengthen hands and planning.' },
      { id: 'm24-e-3', title: 'Name feelings', text: 'Help your child name emotions — happy, angry, sad — so they can use words instead of crying.' }
    ],
    care: [
      { id: 'm24-c-1', title: 'Potty readiness', text: 'Signs include staying dry for 2 hours, interest in the toilet and regular bowel movements. Start when your child is ready, not by the calendar.' },
      { id: 'm24-c-2', title: 'Self-feeding', text: 'Let your child feed themselves; mess is part of learning.' },
      { id: 'm24-c-3', title: 'Screen time', text: 'For ages 2–5, health experts suggest no more than 1 hour a day of high-quality content, watched together.' }
    ],
    redFlags: [
      'Not using two-word phrases',
      'Not following simple instructions',
      'Not walking steadily',
      'Losing words or skills they used to have'
    ]
  }
];

export default en;
