import { count, eq } from 'drizzle-orm'
import { filterTemplates, ingredients, recipeIngredients, recipes } from '../schema'

export const devRecipes = [
  {
    title: 'Spaghetti Cacio e Pepe',
    description:
      'Quintessential Roman pasta prepared with freshly crushed Tellicherry black pepper and aged Pecorino Romano.',
    yieldAmount: 2,
    yieldUnit: 'servings',
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    totalTimeMinutes: 25,
    imageUrl:
      'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=1200&q=80',
    sourceUrl: 'https://example.com/cacio-e-pepe',
    ingredients: [
      { id: '1', name: 'Spaghetti or Tonnarelli', amount: '200', unit: 'g' },
      { id: '2', name: 'Pecorino Romano DOP', amount: '120', unit: 'g', notes: 'finely grated' },
      { id: '3', name: 'Whole Black Peppercorns', amount: '2', unit: 'tbsp', notes: 'freshly cracked' },
      { id: '4', name: 'Fine Sea Salt', amount: '1', unit: 'pinch' },
    ],
    instructions: [
      { step: 1, text: 'Bring a pot of water to a gentle boil with minimal salt.' },
      { step: 2, text: 'Toast freshly cracked black peppercorns in a skillet until fragrant.' },
      { step: 3, text: 'In a bowl, mix grated Pecorino with a ladle of hot pasta water into a velvety emulsion.' },
      { step: 4, text: 'Toss pasta with toasted pepper, remove from heat, and stir in cheese emulsion until glossy.' },
    ],
    tags: {
      course: ['main'],
      weather: ['cold'],
      occasion: ['Everyday'],
      cuisine: ['Italian', 'Roman'],
    },
  },
  {
    title: 'Artisanal Sourdough Focaccia',
    description:
      'Golden blistered crust with an airy crumb infused with extra virgin olive oil and fragrant rosemary.',
    yieldAmount: 8,
    yieldUnit: 'squares',
    prepTimeMinutes: 30,
    cookTimeMinutes: 25,
    totalTimeMinutes: 55,
    imageUrl:
      'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=1200&q=80',
    sourceUrl: '',
    ingredients: [
      { id: '1', name: 'Strong Bread Flour', amount: '500', unit: 'g' },
      { id: '2', name: 'Active Sourdough Starter', amount: '100', unit: 'g' },
      { id: '3', name: 'Lukewarm Water', amount: '400', unit: 'ml' },
      { id: '4', name: 'Extra Virgin Olive Oil', amount: '45', unit: 'ml' },
      { id: '5', name: 'Flaky Maldon Salt', amount: '1.5', unit: 'tsp' },
      { id: '6', name: 'Fresh Rosemary Leaves', amount: '2', unit: 'sprigs' },
    ],
    instructions: [
      { step: 1, text: 'Mix starter, water, and oil, then combine with flour and salt into a shaggy dough.' },
      { step: 2, text: 'Perform 4 stretch-and-folds over 2 hours, then refrigerate for 24 hours.' },
      { step: 3, text: 'Transfer into an oiled baking pan and proof until bubbly and doubled.' },
      { step: 4, text: 'Dimple gently with fingers, scatter rosemary and sea salt.' },
      { step: 5, text: 'Bake at 220°C (425°F) for 25 minutes until golden.' },
    ],
    tags: {
      course: ['side', 'appetizer'],
      weather: ['any'],
      occasion: ['Weekend'],
      cuisine: ['Italian', 'Ligurian'],
    },
  },
  {
    title: 'Authentic Gazpacho Andaluz',
    description:
      'Refreshing chilled Spanish soup made of sun-ripened tomatoes, cucumbers, bell peppers, and sherry vinegar.',
    yieldAmount: 4,
    yieldUnit: 'servings',
    prepTimeMinutes: 15,
    cookTimeMinutes: 0,
    totalTimeMinutes: 15,
    imageUrl:
      'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=1200&q=80',
    sourceUrl: '',
    ingredients: [
      { id: '1', name: 'Vine Ripe Tomatoes', amount: '1', unit: 'kg' },
      { id: '2', name: 'Cucumber', amount: '1', unit: 'medium' },
      { id: '3', name: 'Green Bell Pepper', amount: '1', unit: 'medium' },
      { id: '4', name: 'Garlic Clove', amount: '1', unit: 'clove' },
      { id: '5', name: 'Sherry Vinegar', amount: '2', unit: 'tbsp' },
      { id: '6', name: 'Extra Virgin Olive Oil', amount: '60', unit: 'ml' },
    ],
    instructions: [
      { step: 1, text: 'Chop tomatoes, cucumber, pepper, and garlic.' },
      { step: 2, text: 'Blend smoothly at high speed.' },
      { step: 3, text: 'Stream in olive oil while blending to emulsify.' },
      { step: 4, text: 'Strain and chill for 2 hours before serving.' },
    ],
    tags: {
      course: ['appetizer'],
      weather: ['warm'],
      occasion: ['Everyday'],
      cuisine: ['Spanish', 'Andalusian'],
    },
  },
  {
    title: 'Classic Shakshuka with Feta',
    description:
      'Gently poached farm eggs nestled in a spiced, simmering tomato and sweet bell pepper ragout.',
    yieldAmount: 3,
    yieldUnit: 'servings',
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    totalTimeMinutes: 30,
    imageUrl:
      'https://images.unsplash.com/photo-1590412200988-a436970781fa?auto=format&fit=crop&w=1200&q=80',
    sourceUrl: '',
    ingredients: [
      { id: '1', name: 'Fresh Eggs', amount: '5', unit: 'large' },
      { id: '2', name: 'San Marzano Canned Tomatoes', amount: '800', unit: 'g' },
      { id: '3', name: 'Red Bell Pepper', amount: '1', unit: 'large', notes: 'diced' },
      { id: '4', name: 'Yellow Onion', amount: '1', unit: 'medium', notes: 'finely chopped' },
      { id: '5', name: 'Garlic Cloves', amount: '3', unit: 'cloves', notes: 'minced' },
      { id: '6', name: 'Ground Cumin & Smoked Paprika', amount: '1', unit: 'tbsp' },
      { id: '7', name: 'Feta Cheese', amount: '80', unit: 'g', notes: 'crumbled' },
      { id: '8', name: 'Fresh Cilantro or Parsley', amount: '2', unit: 'tbsp', notes: 'chopped' },
    ],
    instructions: [
      { step: 1, text: 'Sauté chopped onion and bell pepper in olive oil until soft and caramelizing at the edges.' },
      { step: 2, text: 'Add minced garlic, cumin, and smoked paprika; stir for 1 minute until aromatic.' },
      { step: 3, text: 'Pour in crushed tomatoes and simmer over medium-low heat for 12 minutes until reduced.' },
      { step: 4, text: 'Create small wells in the sauce and gently crack eggs into each depression.' },
      { step: 5, text: 'Scatter crumbled feta, cover skillet, and cook for 4-6 minutes until egg whites are just set.' },
    ],
    tags: {
      course: ['breakfast', 'main'],
      weather: ['any'],
      occasion: ['Weekend'],
      cuisine: ['Middle Eastern', 'Levantine'],
    },
  },
  {
    title: 'Tonkotsu Ramen with Chashu Pork',
    description:
      'Rich, collagen-infused pork bone broth served with springy noodles, melt-in-your-mouth braised chashu, and marinated ajitsuke tamago.',
    yieldAmount: 2,
    yieldUnit: 'large bowls',
    prepTimeMinutes: 45,
    cookTimeMinutes: 180,
    totalTimeMinutes: 225,
    imageUrl:
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80',
    sourceUrl: '',
    ingredients: [
      { id: '1', name: 'Fresh Ramen Noodles', amount: '300', unit: 'g' },
      { id: '2', name: 'Rich Pork Bone Broth', amount: '900', unit: 'ml' },
      { id: '3', name: 'Pork Belly Chashu', amount: '4', unit: 'thick slices' },
      { id: '4', name: 'Ajitsuke Tamago (Ramen Egg)', amount: '2', unit: 'halved' },
      { id: '5', name: 'Shoyu Tare', amount: '4', unit: 'tbsp' },
      { id: '6', name: 'Scallions', amount: '3', unit: 'stalks', notes: 'finely sliced' },
      { id: '7', name: 'Nori Seaweed Sheets', amount: '2', unit: 'sheets' },
      { id: '8', name: 'Mayu (Black Garlic Oil)', amount: '1', unit: 'tsp' },
    ],
    instructions: [
      { step: 1, text: 'Warm ramen serving bowls with hot water and discard water.' },
      { step: 2, text: 'Add 2 tablespoons of Shoyu Tare and hot pork broth into each bowl and whisk together.' },
      { step: 3, text: 'Boil fresh noodles for precisely 80 seconds, shake out moisture thoroughly, and fold into broth.' },
      { step: 4, text: 'Arrange torched chashu slices, halved seasoned eggs, scallions, nori, and a drizzle of garlic oil.' },
    ],
    tags: {
      course: ['main'],
      weather: ['cold'],
      occasion: ['Weekend'],
      cuisine: ['Japanese'],
    },
  },
  {
    title: 'Oaxacan Chicken Mole Negro',
    description:
      'Complex and velvety Oaxacan dark sauce composed of dried chilies, Mexican chocolate, spices, and roasted sesame seeds over tender chicken.',
    yieldAmount: 6,
    yieldUnit: 'servings',
    prepTimeMinutes: 50,
    cookTimeMinutes: 90,
    totalTimeMinutes: 140,
    imageUrl:
      'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?auto=format&fit=crop&w=1200&q=80',
    sourceUrl: '',
    ingredients: [
      { id: '1', name: 'Whole Chicken Pieces', amount: '1.4', unit: 'kg' },
      { id: '2', name: 'Dried Pasilla & Mulato Chiles', amount: '8', unit: 'pods', notes: 'stemmed & seeded' },
      { id: '3', name: 'Mexican Dark Chocolate (Abuelita/Ibarra)', amount: '60', unit: 'g' },
      { id: '4', name: 'Plantain', amount: '0.5', unit: 'medium', notes: 'sliced & fried' },
      { id: '5', name: 'Toasted White Sesame Seeds', amount: '3', unit: 'tbsp' },
      { id: '6', name: 'Corn Tortillas', amount: '2', unit: 'charred' },
      { id: '7', name: 'Rich Chicken Stock', amount: '750', unit: 'ml' },
    ],
    instructions: [
      { step: 1, text: 'Toast dried chilies in a dry comal until aromatic, then soak in boiling water for 20 minutes.' },
      { step: 2, text: 'Char onion, garlic, tomatoes, and tomatillos; fry plantain and charred tortillas.' },
      { step: 3, text: 'Blend softened chiles, roasted vegetables, spices, and stock into a smooth, thick purée.' },
      { step: 4, text: 'Simmer mole purée in lard or oil, melt in Mexican dark chocolate, and braise chicken until fork-tender.' },
    ],
    tags: {
      course: ['main'],
      weather: ['any'],
      occasion: ['Festive'],
      cuisine: ['Mexican', 'Oaxacan'],
    },
  },
  {
    title: 'Butter Chicken (Murgh Makhani)',
    description:
      'Tandoori-spiced marinated chicken thighs simmered in an indulgent tomato, fenugreek, and cashew cream butter gravy.',
    yieldAmount: 4,
    yieldUnit: 'servings',
    prepTimeMinutes: 30,
    cookTimeMinutes: 35,
    totalTimeMinutes: 65,
    imageUrl:
      'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=1200&q=80',
    sourceUrl: '',
    ingredients: [
      { id: '1', name: 'Boneless Chicken Thighs', amount: '700', unit: 'g', notes: 'cubed' },
      { id: '2', name: 'Greek Yogurt', amount: '120', unit: 'g' },
      { id: '3', name: 'Tomato Passata', amount: '450', unit: 'g' },
      { id: '4', name: 'Ghee & Butter', amount: '50', unit: 'g' },
      { id: '5', name: 'Heavy Cream', amount: '100', unit: 'ml' },
      { id: '6', name: 'Garam Masala & Kashmiri Chili', amount: '2', unit: 'tbsp' },
      { id: '7', name: 'Kasuri Methi (Dried Fenugreek)', amount: '1', unit: 'tbsp' },
    ],
    instructions: [
      { step: 1, text: 'Marinate chicken in yogurt, lemon juice, ginger-garlic paste, and spices for at least 1 hour.' },
      { step: 2, text: 'Broil or pan-sear chicken on high heat until charred at edges, then set aside.' },
      { step: 3, text: 'Cook tomato passata with spices, butter, and cashew paste until oil begins to separate.' },
      { step: 4, text: 'Add charred chicken, stir in heavy cream and crushed kasuri methi, and simmer for 8 minutes.' },
    ],
    tags: {
      course: ['main'],
      weather: ['cold'],
      occasion: ['Weekend'],
      cuisine: ['Indian', 'Punjabi'],
    },
  },
  {
    title: 'Traditional Thai Green Curry (Gaeng Keow Wan)',
    description:
      'Aromatic coconut milk curry with tender chicken breast, Thai eggplants, bamboo shoots, and fragrant sweet Thai basil.',
    yieldAmount: 4,
    yieldUnit: 'servings',
    prepTimeMinutes: 20,
    cookTimeMinutes: 20,
    totalTimeMinutes: 40,
    imageUrl:
      'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=1200&q=80',
    sourceUrl: '',
    ingredients: [
      { id: '1', name: 'Chicken Breast or Thighs', amount: '500', unit: 'g', notes: 'thinly sliced' },
      { id: '2', name: 'Authentic Green Curry Paste', amount: '3', unit: 'tbsp' },
      { id: '3', name: 'Full Fat Coconut Milk', amount: '400', unit: 'ml' },
      { id: '4', name: 'Thai Round Eggplants', amount: '4', unit: 'quartered' },
      { id: '5', name: 'Fish Sauce (Nam Pla)', amount: '2', unit: 'tbsp' },
      { id: '6', name: 'Palm Sugar', amount: '1', unit: 'tbsp' },
      { id: '7', name: 'Makrut Lime Leaves & Thai Basil', amount: '1', unit: 'cup' },
    ],
    instructions: [
      { step: 1, text: 'Simmer 100ml coconut milk until coconut cream separates and green paste fries in its oil.' },
      { step: 2, text: 'Add chicken slices and brown lightly in the fragrant green paste.' },
      { step: 3, text: 'Pour in remainder of coconut milk and 100ml water or light broth; bring to a boil.' },
      { step: 4, text: 'Drop in eggplants and bamboo shoots; season with fish sauce and palm sugar.' },
      { step: 5, text: 'Finish with torn makrut lime leaves and a handful of Thai basil leaves off the heat.' },
    ],
    tags: {
      course: ['main'],
      weather: ['warm'],
      occasion: ['Everyday'],
      cuisine: ['Thai'],
    },
  },
  {
    title: 'French Beef Bourguignon',
    description:
      'Tender braised beef chuck in a rich Pinot Noir broth garnished with pearl onions, cremini mushrooms, and crisp lardons.',
    yieldAmount: 6,
    yieldUnit: 'servings',
    prepTimeMinutes: 40,
    cookTimeMinutes: 180,
    totalTimeMinutes: 220,
    imageUrl:
      'https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=1200&q=80',
    sourceUrl: '',
    ingredients: [
      { id: '1', name: 'Beef Chuck Roast', amount: '1.2', unit: 'kg', notes: 'cut into 2-inch chunks' },
      { id: '2', name: 'Smoked Bacon or Lardons', amount: '180', unit: 'g', notes: 'diced' },
      { id: '3', name: 'Dry Red Burgundy Wine', amount: '750', unit: 'ml' },
      { id: '4', name: 'Beef Stock', amount: '500', unit: 'ml' },
      { id: '5', name: 'Cremini Mushrooms', amount: '300', unit: 'g', notes: 'quartered' },
      { id: '6', name: 'Pearl Onions', amount: '15', unit: 'peeled' },
      { id: '7', name: 'Carrots & Celery', amount: '3', unit: 'large' },
      { id: '8', name: 'Bouquet Garni (Thyme, Bay, Parsley)', amount: '1', unit: 'bundle' },
    ],
    instructions: [
      { step: 1, text: 'Crisp lardons in a heavy Dutch oven, remove and sear dry beef cubes in batches until deeply browned.' },
      { step: 2, text: 'Sauté carrots and onions in beef drippings, then stir in 2 tbsp flour and tomato paste.' },
      { step: 3, text: 'Deglaze with red wine and beef stock; return beef and lardons with bouquet garni.' },
      { step: 4, text: 'Cover and braise in oven at 160°C (325°F) for 3 hours until spoon-tender.' },
      { step: 5, text: 'Sauté pearl onions and mushrooms separately in butter, folding into stew before serving.' },
    ],
    tags: {
      course: ['main'],
      weather: ['cold'],
      occasion: ['Festive'],
      cuisine: ['French', 'Burgundian'],
    },
  },
  {
    title: 'Authentic Vietnamese Beef Pho (Phở Bò)',
    description:
      'Fragrant 12-hour spiced bone broth infused with charred star anise, cinnamon, and ginger, over rice noodles and thin sirloin.',
    yieldAmount: 4,
    yieldUnit: 'bowls',
    prepTimeMinutes: 30,
    cookTimeMinutes: 240,
    totalTimeMinutes: 270,
    imageUrl:
      'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=1200&q=80',
    sourceUrl: '',
    ingredients: [
      { id: '1', name: 'Beef Marrow & Knuckle Bones', amount: '1.8', unit: 'kg' },
      { id: '2', name: 'Beef Sirloin or Eye Round', amount: '300', unit: 'g', notes: 'shaved paper thin' },
      { id: '3', name: 'Flat Rice Pho Noodles', amount: '400', unit: 'g' },
      { id: '4', name: 'Whole Spices (Star Anise, Cinnamon, Cloves, Cardamom)', amount: '1', unit: 'sachet' },
      { id: '5', name: 'Charred Yellow Onions & Ginger', amount: '2', unit: 'onions' },
      { id: '6', name: 'Fish Sauce & Yellow Rock Sugar', amount: '3', unit: 'tbsp' },
      { id: '7', name: 'Fresh Thai Basil, Mint, Lime & Jalapeño', amount: '1', unit: 'platter' },
    ],
    instructions: [
      { step: 1, text: 'Parboil bones for 10 minutes, drain and scrub clean under cold water to ensure a crystal broth.' },
      { step: 2, text: 'Char onions and ginger; toast whole spices in a dry skillet.' },
      { step: 3, text: 'Simmer clean bones, charred aromatics, and spice sachet gently for 4-6 hours, skimming impurities.' },
      { step: 4, text: 'Season with premium fish sauce and yellow rock sugar.' },
      { step: 5, text: 'Assemble cooked noodles in bowls, top with raw shaved beef, and ladle boiling broth to gently cook meat.' },
    ],
    tags: {
      course: ['main'],
      weather: ['cold'],
      occasion: ['Weekend'],
      cuisine: ['Vietnamese', 'Northern Vietnamese'],
    },
  },
  {
    title: 'Fluffy Japanese Soufflé Pancakes',
    description:
      'Cloud-like jiggly pancakes made with folded meringue, served warm with salted butter, maple syrup, and fresh berries.',
    yieldAmount: 4,
    yieldUnit: 'tall pancakes',
    prepTimeMinutes: 20,
    cookTimeMinutes: 15,
    totalTimeMinutes: 35,
    imageUrl:
      'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=1200&q=80',
    sourceUrl: '',
    ingredients: [
      { id: '1', name: 'Egg Whites', amount: '3', unit: 'large' },
      { id: '2', name: 'Egg Yolks', amount: '2', unit: 'large' },
      { id: '3', name: 'Whole Milk', amount: '25', unit: 'ml' },
      { id: '4', name: 'Cake Flour', amount: '35', unit: 'g' },
      { id: '5', name: 'Granulated Sugar', amount: '30', unit: 'g' },
      { id: '6', name: 'Vanilla Extract', amount: '0.5', unit: 'tsp' },
      { id: '7', name: 'Pure Maple Syrup & Fresh Berries', amount: '1', unit: 'garnish' },
    ],
    instructions: [
      { step: 1, text: 'Whisk egg yolks, milk, and vanilla, then sift in cake flour until smooth.' },
      { step: 2, text: 'Whip egg whites with sugar in 3 additions until glossy, stiff peaks form.' },
      { step: 3, text: 'Gently fold 1/3 of the meringue into the yolk base, then delicately fold in the remainder.' },
      { step: 4, text: 'Pipe tall mounds onto a lightly oiled low-heat pan, add 1 tsp water, cover and cook for 5 minutes.' },
      { step: 5, text: 'Add another scoop on top, flip gently, add water, cover and steam 5 more minutes.' },
    ],
    tags: {
      course: ['breakfast', 'dessert'],
      weather: ['any'],
      occasion: ['Weekend'],
      cuisine: ['Japanese'],
    },
  },
  {
    title: 'Authentic Greek Moussaka',
    description:
      'Layered Mediterranean bake of golden roasted eggplant, spiced lamb ragù with cinnamon and nutmeg, topped with velvety béchamel.',
    yieldAmount: 8,
    yieldUnit: 'hearty portions',
    prepTimeMinutes: 45,
    cookTimeMinutes: 60,
    totalTimeMinutes: 105,
    imageUrl:
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
    sourceUrl: '',
    ingredients: [
      { id: '1', name: 'Large Eggplants', amount: '3', unit: 'sliced lengthwise' },
      { id: '2', name: 'Ground Lamb or Beef', amount: '750', unit: 'g' },
      { id: '3', name: 'Crushed Tomatoes', amount: '400', unit: 'g' },
      { id: '4', name: 'Cinnamon & Allspice', amount: '1', unit: 'tsp each' },
      { id: '5', name: 'Butter & All-Purpose Flour', amount: '60', unit: 'g each' },
      { id: '6', name: 'Whole Milk', amount: '600', unit: 'ml' },
      { id: '7', name: 'Kefalotyri or Parmesan Cheese', amount: '80', unit: 'g', notes: 'grated' },
      { id: '8', name: 'Egg Yolks', amount: '2', unit: 'large' },
    ],
    instructions: [
      { step: 1, text: 'Brush eggplant slices with olive oil and roast at 200°C (400°F) until golden.' },
      { step: 2, text: 'Brown ground lamb with onions, garlic, red wine, cinnamon, allspice, and tomatoes; simmer until thick.' },
      { step: 3, text: 'Prepare béchamel sauce with roux and warm milk, whisking in egg yolks and grated cheese off the heat.' },
      { step: 4, text: 'Layer roasted eggplant in baking dish, cover with lamb sauce, top with second layer of eggplant.' },
      { step: 5, text: 'Spread béchamel over the top, sprinkle cheese, and bake at 180°C (350°F) for 50 minutes until bronzed.' },
    ],
    tags: {
      course: ['main'],
      weather: ['cold'],
      occasion: ['Festive'],
      cuisine: ['Greek', 'Mediterranean'],
    },
  },
  {
    title: 'Classic Mexican Guacamole & Totopos',
    description:
      'Freshly crushed Hass avocados with lime juice, minced jalapeño, white onion, cilantro, and warm hand-cut corn totopos.',
    yieldAmount: 4,
    yieldUnit: 'servings',
    prepTimeMinutes: 12,
    cookTimeMinutes: 0,
    totalTimeMinutes: 12,
    imageUrl:
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',
    sourceUrl: '',
    ingredients: [
      { id: '1', name: 'Ripe Hass Avocados', amount: '3', unit: 'medium' },
      { id: '2', name: 'Fresh Lime Juice', amount: '2', unit: 'tbsp' },
      { id: '3', name: 'White Onion', amount: '0.5', unit: 'finely diced' },
      { id: '4', name: 'Fresh Jalapeño or Serrano', amount: '1', unit: 'seeded & minced' },
      { id: '5', name: 'Fresh Cilantro Leaves', amount: '0.25', unit: 'cup', notes: 'chopped' },
      { id: '6', name: 'Coarse Sea Salt', amount: '0.75', unit: 'tsp' },
      { id: '7', name: 'Corn Tortilla Chips', amount: '1', unit: 'basket' },
    ],
    instructions: [
      { step: 1, text: 'In a molcajete or bowl, mash diced onion, chili, and sea salt into a fragrant paste.' },
      { step: 2, text: 'Scoop in avocado flesh and gently crush with a fork, retaining medium chunks.' },
      { step: 3, text: 'Fold in fresh lime juice and chopped cilantro, tasting for salt.' },
      { step: 4, text: 'Serve immediately with warm corn tortilla chips.' },
    ],
    tags: {
      course: ['appetizer', 'side'],
      weather: ['warm'],
      occasion: ['Everyday'],
      cuisine: ['Mexican'],
    },
  },
  {
    title: 'Authentic Tiramisù al Mascarpone',
    description:
      'Classic Italian layered dessert with espresso-soaked Savoiardi ladyfingers and whipped egg-mascarpone cream dusted with cocoa.',
    yieldAmount: 8,
    yieldUnit: 'generous servings',
    prepTimeMinutes: 30,
    cookTimeMinutes: 0,
    totalTimeMinutes: 30,
    imageUrl:
      'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=1200&q=80',
    sourceUrl: '',
    ingredients: [
      { id: '1', name: 'Italian Savoiardi Ladyfingers', amount: '300', unit: 'g' },
      { id: '2', name: 'Mascarpone Cheese', amount: '500', unit: 'g', notes: 'room temperature' },
      { id: '3', name: 'Fresh Egg Yolks & Whites', amount: '4', unit: 'large eggs' },
      { id: '4', name: 'Granulated Sugar', amount: '100', unit: 'g' },
      { id: '5', name: 'Fresh Brewed Strong Espresso', amount: '350', unit: 'ml' },
      { id: '6', name: 'Marsala Wine or Dark Rum', amount: '3', unit: 'tbsp' },
      { id: '7', name: 'Dutch-Process Cocoa Powder', amount: '3', unit: 'tbsp', notes: 'for dusting' },
    ],
    instructions: [
      { step: 1, text: 'Whip egg yolks with sugar until pale and thick ribbons form; fold in mascarpone until smooth.' },
      { step: 2, text: 'Whip egg whites to stiff peaks and gently fold into the mascarpone mixture.' },
      { step: 3, text: 'Combine espresso and Marsala; quickly dip ladyfingers (1 second per side) and arrange in dish.' },
      { step: 4, text: 'Spread half the cream, layer another round of dipped ladyfingers, and top with remaining cream.' },
      { step: 5, text: 'Refrigerate for 6 hours; dust generously with unsweetened cocoa powder before serving.' },
    ],
    tags: {
      course: ['dessert'],
      weather: ['any'],
      occasion: ['Festive'],
      cuisine: ['Italian', 'Venetian'],
    },
  },
  {
    title: 'Moroccan Lamb Tagine with Prunes',
    description:
      'Slow-braised lamb shanks in ras el hanout, saffron, and honey, topped with sweet caramelized prunes and toasted almonds.',
    yieldAmount: 4,
    yieldUnit: 'servings',
    prepTimeMinutes: 25,
    cookTimeMinutes: 120,
    totalTimeMinutes: 145,
    imageUrl:
      'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&w=1200&q=80',
    sourceUrl: '',
    ingredients: [
      { id: '1', name: 'Bone-in Lamb Shanks or Shoulder', amount: '1', unit: 'kg' },
      { id: '2', name: 'Yellow Onions', amount: '2', unit: 'grated' },
      { id: '3', name: 'Ras el Hanout & Ginger', amount: '1', unit: 'tbsp each' },
      { id: '4', name: 'Saffron Threads', amount: '1', unit: 'pinch', notes: 'soaked in warm water' },
      { id: '5', name: 'Dried Prunes', amount: '200', unit: 'g' },
      { id: '6', name: 'Orange Blossom Water & Honey', amount: '1', unit: 'tbsp each' },
      { id: '7', name: 'Blanched Fried Almonds', amount: '50', unit: 'g' },
    ],
    instructions: [
      { step: 1, text: 'Rub lamb with ras el hanout, ginger, garlic, salt, and saffron infusion.' },
      { step: 2, text: 'Brown lamb pieces with grated onions in olive oil in a heavy tagine pot.' },
      { step: 3, text: 'Add 200ml water, cover tightly, and simmer on low heat for 90 minutes.' },
      { step: 4, text: 'Simmer prunes separately with a ladle of tagine broth, honey, and cinnamon until glossy.' },
      { step: 5, text: 'Arrange caramelized prunes over tender lamb and garnish with golden almonds.' },
    ],
    tags: {
      course: ['main'],
      weather: ['cold'],
      occasion: ['Festive'],
      cuisine: ['Moroccan', 'North African'],
    },
  },
  {
    title: 'Belgian Liege Waffles with Pearl Sugar',
    description:
      'Decadent brioche yeast waffles embedded with Belgian pearl sugar clusters that caramelize during griddling.',
    yieldAmount: 8,
    yieldUnit: 'waffles',
    prepTimeMinutes: 40,
    cookTimeMinutes: 15,
    totalTimeMinutes: 55,
    imageUrl:
      'https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=1200&q=80',
    sourceUrl: '',
    ingredients: [
      { id: '1', name: 'All-Purpose Flour', amount: '375', unit: 'g' },
      { id: '2', name: 'Active Dry Yeast', amount: '7', unit: 'g' },
      { id: '3', name: 'Unsalted Butter', amount: '150', unit: 'g', notes: 'softened' },
      { id: '4', name: 'Whole Milk', amount: '135', unit: 'ml', notes: 'lukewarm' },
      { id: '5', name: 'Whole Eggs', amount: '2', unit: 'large' },
      { id: '6', name: 'Belgian Pearl Sugar', amount: '180', unit: 'g' },
      { id: '7', name: 'Vanilla Bean Paste', amount: '1', unit: 'tsp' },
    ],
    instructions: [
      { step: 1, text: 'Combine yeast, warm milk, and 1 tbsp sugar; allow to bloom for 10 minutes.' },
      { step: 2, text: 'Knead flour, eggs, yeast mixture, and butter into a soft, sticky brioche dough.' },
      { step: 3, text: 'Cover and let rise in a warm spot for 60 minutes until doubled in size.' },
      { step: 4, text: 'Gently fold pearl sugar into the dough and divide into 8 round portions.' },
      { step: 5, text: 'Bake in a preheated cast iron waffle maker for 3-4 minutes until dark caramel brown.' },
    ],
    tags: {
      course: ['breakfast', 'dessert'],
      weather: ['any'],
      occasion: ['Weekend'],
      cuisine: ['Belgian', 'Flemish'],
    },
  },
  {
    title: 'Classic American Smash Burger',
    description:
      'Crispy lacy-edged smashed beef patties with melted American cheese, caramelized onions, and house burger sauce on a brioche bun.',
    yieldAmount: 2,
    yieldUnit: 'double burgers',
    prepTimeMinutes: 15,
    cookTimeMinutes: 10,
    totalTimeMinutes: 25,
    imageUrl:
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80',
    sourceUrl: '',
    ingredients: [
      { id: '1', name: '80/20 Ground Beef Chuck', amount: '400', unit: 'g', notes: 'divided into 4 loose balls' },
      { id: '2', name: 'American Cheese Slices', amount: '4', unit: 'slices' },
      { id: '3', name: 'Brioche Burger Buns', amount: '2', unit: 'toasted' },
      { id: '4', name: 'Dill Pickle Chips', amount: '6', unit: 'slices' },
      { id: '5', name: 'Burger Sauce (Mayo, Ketchup, Relish, Mustard)', amount: '3', unit: 'tbsp' },
      { id: '6', name: 'Kosher Salt & Fresh Black Pepper', amount: '1', unit: 'tsp' },
    ],
    instructions: [
      { step: 1, text: 'Heat a heavy cast iron griddle over high heat until smoking lightly.' },
      { step: 2, text: 'Place beef balls on griddle and smash down firmly with a parchment-lined heavy spatula into thin patties.' },
      { step: 3, text: 'Season with salt and pepper; sear undisturbed for 2 minutes until dark crust forms.' },
      { step: 4, text: 'Scrape underneath, flip, immediately top with American cheese, and stack patties.' },
      { step: 5, text: 'Assemble on toasted brioche buns with special sauce and dill pickles.' },
    ],
    tags: {
      course: ['main'],
      weather: ['any'],
      occasion: ['Everyday'],
      cuisine: ['American'],
    },
  },
  {
    title: 'Peruvian Ceviche Clásico',
    description:
      'Ultra-fresh sea bass cured in vibrant Leche de Tigre lime juice, red onions, habanero chili, served with sweet potato and choclo corn.',
    yieldAmount: 4,
    yieldUnit: 'appetizer servings',
    prepTimeMinutes: 20,
    cookTimeMinutes: 0,
    totalTimeMinutes: 20,
    imageUrl:
      'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?auto=format&fit=crop&w=1200&q=80',
    sourceUrl: '',
    ingredients: [
      { id: '1', name: 'Fresh Corvina or Sea Bass Fillet', amount: '500', unit: 'g', notes: 'cubed' },
      { id: '2', name: 'Fresh Key Lime Juice', amount: '180', unit: 'ml' },
      { id: '3', name: 'Ají Limo or Habanero Pepper', amount: '1', unit: 'finely sliced' },
      { id: '4', name: 'Red Onion', amount: '1', unit: 'julienned & rinsed' },
      { id: '5', name: 'Fresh Cilantro Leaves', amount: '2', unit: 'tbsp' },
      { id: '6', name: 'Cooked Sweet Potato Rounds', amount: '2', unit: 'medium' },
      { id: '7', name: 'Choclo (Giant Peruvian Corn)', amount: '1', unit: 'cup' },
    ],
    instructions: [
      { step: 1, text: 'Place cubed fresh fish in a chilled bowl and season generously with sea salt.' },
      { step: 2, text: 'Add sliced ají chili and cilantro, then pour over freshly squeezed lime juice.' },
      { step: 3, text: 'Toss gently for 2 minutes to create the milky Leche de Tigre sauce.' },
      { step: 4, text: 'Fold in rinsed crisp red onions and serve immediately alongside sweet potato and choclo.' },
    ],
    tags: {
      course: ['appetizer', 'main'],
      weather: ['warm'],
      occasion: ['Weekend'],
      cuisine: ['Peruvian', 'South American'],
    },
  },
  {
    title: 'Turkish Shakshuka Dip (Şakşuka)',
    description:
      'Meze plate of tender fried eggplants and zucchini tossed in a garlicky spiced tomato-pepper coulis with herbs.',
    yieldAmount: 4,
    yieldUnit: 'meze portions',
    prepTimeMinutes: 20,
    cookTimeMinutes: 25,
    totalTimeMinutes: 45,
    imageUrl:
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',
    sourceUrl: '',
    ingredients: [
      { id: '1', name: 'Eggplants', amount: '2', unit: 'medium', notes: 'cubed' },
      { id: '2', name: 'Zucchini', amount: '2', unit: 'medium', notes: 'cubed' },
      { id: '3', name: 'Sweet Green Peppers (Sivri Biber)', amount: '3', unit: 'sliced' },
      { id: '4', name: 'Ripe Vine Tomatoes', amount: '4', unit: 'grated' },
      { id: '5', name: 'Garlic Cloves', amount: '4', unit: 'crushed' },
      { id: '6', name: 'Olive Oil', amount: '100', unit: 'ml' },
      { id: '7', name: 'Fresh Flat-Leaf Parsley', amount: '3', unit: 'tbsp', notes: 'chopped' },
    ],
    instructions: [
      { step: 1, text: 'Fry eggplant and zucchini cubes in hot olive oil until golden and caramelized; drain on paper towels.' },
      { step: 2, text: 'In a saucepan, simmer grated tomatoes, garlic, peppers, vinegar, and olive oil for 15 minutes.' },
      { step: 3, text: 'Gently combine fried vegetables with warm tomato sauce in a shallow serving platter.' },
      { step: 4, text: 'Garnish with fresh parsley and serve at room temperature with crusty flatbread.' },
    ],
    tags: {
      course: ['appetizer', 'side'],
      weather: ['warm'],
      occasion: ['Everyday'],
      cuisine: ['Turkish', 'Middle Eastern'],
    },
  },
  {
    title: 'Brazilian Pão de Queijo',
    description:
      'Naturally gluten-free Brazilian cheese bread puffs with a chewy, airy interior and crispy golden cheese crust.',
    yieldAmount: 24,
    yieldUnit: 'puffs',
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    totalTimeMinutes: 35,
    imageUrl:
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
    sourceUrl: '',
    ingredients: [
      { id: '1', name: 'Tapioca Starch / Flour', amount: '400', unit: 'g' },
      { id: '2', name: 'Whole Milk', amount: '200', unit: 'ml' },
      { id: '3', name: 'Vegetable Oil', amount: '100', unit: 'ml' },
      { id: '4', name: 'Grated Queso Meia Cura or Aged Parmesan', amount: '200', unit: 'g' },
      { id: '5', name: 'Eggs', amount: '2', unit: 'large' },
      { id: '6', name: 'Fine Sea Salt', amount: '1', unit: 'tsp' },
    ],
    instructions: [
      { step: 1, text: 'Bring milk, oil, and salt to a rolling boil in a small saucepan.' },
      { step: 2, text: 'Pour boiling liquid over tapioca flour in a stand mixer bowl; stir until smooth and let cool.' },
      { step: 3, text: 'Beat in eggs one at a time, then fold in grated cheese until sticky elastic dough forms.' },
      { step: 4, text: 'Roll into 1.5-inch balls with oiled hands and space onto baking sheets.' },
      { step: 5, text: 'Bake at 190°C (375°F) for 20 minutes until puffed and light golden.' },
    ],
    tags: {
      course: ['breakfast', 'appetizer', 'side'],
      weather: ['any'],
      occasion: ['Everyday'],
      cuisine: ['Brazilian', 'South American'],
    },
  },
  {
    title: 'Ethiopian Doro Wat with Injera',
    description:
      'Rich and deeply spiced chicken stew slow-cooked with berbere spice, spiced clarified butter (niter kibbeh), and hard-boiled eggs.',
    yieldAmount: 4,
    yieldUnit: 'servings',
    prepTimeMinutes: 30,
    cookTimeMinutes: 90,
    totalTimeMinutes: 120,
    imageUrl:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80',
    sourceUrl: '',
    ingredients: [
      { id: '1', name: 'Chicken Drumsticks and Thighs', amount: '1', unit: 'kg' },
      { id: '2', name: 'Red Onions', amount: '1', unit: 'kg', notes: 'finely puréed' },
      { id: '3', name: 'Berbere Spice Blend', amount: '4', unit: 'tbsp' },
      { id: '4', name: 'Niter Kibbeh (Ethiopian Spiced Butter)', amount: '100', unit: 'g' },
      { id: '5', name: 'Hard-Boiled Eggs', amount: '4', unit: 'peeled & pierced' },
      { id: '6', name: 'Garlic and Ginger Paste', amount: '2', unit: 'tbsp' },
      { id: '7', name: 'Injera Flatbread', amount: '4', unit: 'rolls' },
    ],
    instructions: [
      { step: 1, text: 'Cook puréed onions in a dry Dutch oven for 30 minutes, stirring constantly until reduced and dark purple.' },
      { step: 2, text: 'Add niter kibbeh, garlic-ginger paste, and berbere; fry for 15 minutes to develop rich aromatics.' },
      { step: 3, text: 'Add chicken pieces and 200ml water; simmer on low heat for 45 minutes until chicken is tender.' },
      { step: 4, text: 'Nestle pierced hard-boiled eggs into the sauce for the final 10 minutes to absorb flavor.' },
      { step: 5, text: 'Serve family style over fermented teff injera bread.' },
    ],
    tags: {
      course: ['main'],
      weather: ['cold'],
      occasion: ['Festive'],
      cuisine: ['Ethiopian', 'East African'],
    },
  },
  {
    title: 'Swedish Cinnamon Cardamom Buns (Kanelbullar)',
    description:
      'Fragrant Scandinavian twisted yeast dough enriched with crushed cardamom pods and layered with caramelized cinnamon sugar.',
    yieldAmount: 12,
    yieldUnit: 'twisted buns',
    prepTimeMinutes: 45,
    cookTimeMinutes: 12,
    totalTimeMinutes: 57,
    imageUrl:
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
    sourceUrl: '',
    ingredients: [
      { id: '1', name: 'All-Purpose Flour', amount: '500', unit: 'g' },
      { id: '2', name: 'Whole Milk', amount: '250', unit: 'ml', notes: 'lukewarm' },
      { id: '3', name: 'Freshly Crushed Green Cardamom', amount: '1.5', unit: 'tbsp' },
      { id: '4', name: 'Unsalted Butter', amount: '150', unit: 'g', notes: 'softened' },
      { id: '5', name: 'Brown Sugar & Ground Cinnamon', amount: '100', unit: 'g sugar + 2 tbsp cinnamon' },
      { id: '6', name: 'Swedish Pearl Sugar', amount: '3', unit: 'tbsp', notes: 'for topping' },
      { id: '7', name: 'Simple Sugar Syrup', amount: '50', unit: 'ml', notes: 'for glaze' },
    ],
    instructions: [
      { step: 1, text: 'Knead flour, cardamom, milk, yeast, sugar, and 75g butter into a supple, elastic dough; proof 60 minutes.' },
      { step: 2, text: 'Roll dough into a large rectangle and spread remaining butter, brown sugar, and cinnamon evenly.' },
      { step: 3, text: 'Fold into thirds, slice into strips, twist each strip like a rope, and tie into a Swedish knot.' },
      { step: 4, text: 'Proof buns for 30 minutes on baking sheets, brush with egg wash, and sprinkle pearl sugar.' },
      { step: 5, text: 'Bake at 220°C (425°F) for 9-11 minutes; brush with sugar syrup immediately when out of the oven.' },
    ],
    tags: {
      course: ['breakfast', 'dessert'],
      weather: ['cold'],
      occasion: ['Weekend'],
      cuisine: ['Swedish'],
    },
  },
  {
    title: 'Classic Lebanese Tabbouleh',
    description:
      'Crisp, herb-forward salad made with mountains of finely chopped flat-leaf parsley, fresh mint, vine tomatoes, and fine bulgur.',
    yieldAmount: 6,
    yieldUnit: 'meze servings',
    prepTimeMinutes: 25,
    cookTimeMinutes: 0,
    totalTimeMinutes: 25,
    imageUrl:
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',
    sourceUrl: '',
    ingredients: [
      { id: '1', name: 'Fresh Flat-Leaf Parsley', amount: '4', unit: 'large bunches', notes: 'leaves finely minced' },
      { id: '2', name: 'Fresh Mint Leaves', amount: '1', unit: 'bunch', notes: 'finely minced' },
      { id: '3', name: 'Firm Vine Tomatoes', amount: '4', unit: 'finely diced' },
      { id: '4', name: 'Fine #1 Bulgur Wheat', amount: '45', unit: 'g', notes: 'rinsed & drained' },
      { id: '5', name: 'Scallions / Spring Onions', amount: '4', unit: 'stalks', notes: 'finely sliced' },
      { id: '6', name: 'Extra Virgin Olive Oil & Lemon Juice', amount: '80', unit: 'ml each' },
      { id: '7', name: 'Romaine Lettuce Leaves', amount: '1', unit: 'head', notes: 'for serving' },
    ],
    instructions: [
      { step: 1, text: 'Rinse bulgur and soak in fresh lemon juice and tomato juices for 15 minutes to soften.' },
      { step: 2, text: 'Wash and dry herbs completely; finely chop parsley, mint, and scallions.' },
      { step: 3, text: 'In a large bowl, combine chopped herbs, diced tomatoes, and hydrated bulgur.' },
      { step: 4, text: 'Dress with extra virgin olive oil, salt, and freshly cracked black pepper.' },
      { step: 5, text: 'Serve chilled or room temperature with crisp romaine lettuce leaves used as scoops.' },
    ],
    tags: {
      course: ['appetizer', 'side'],
      weather: ['warm'],
      occasion: ['Everyday'],
      cuisine: ['Lebanese', 'Levantine'],
    },
  },
]

export const devFilterTemplates = [
  {
    name: 'Quick Weekday Dinners',
    criteria: {
      searchQuery: '',
      maxTotalTime: 30,
      selectedIngredients: [],
      selectedTags: { occasion: ['Everyday'] },
      matchModePerElement: { ingredients: 'any', tags: 'any', categoryTags: {} },
      hasImage: 'any',
      onlyConflicts: 'any',
    },
    useCount: 12,
    lastUsedAt: new Date(Date.now() - 3600000 * 3),
  },
  {
    name: 'Summer Refreshers',
    criteria: {
      searchQuery: '',
      selectedIngredients: [],
      selectedTags: { weather: ['warm'] },
      matchModePerElement: { ingredients: 'any', tags: 'any', categoryTags: {} },
      hasImage: 'any',
      onlyConflicts: 'any',
    },
    useCount: 8,
    lastUsedAt: new Date(Date.now() - 3600000 * 24),
  },
  {
    name: 'Italian Classics',
    criteria: {
      searchQuery: '',
      selectedIngredients: [],
      selectedTags: { cuisine: ['Italian'] },
      matchModePerElement: { ingredients: 'any', tags: 'any', categoryTags: {} },
      hasImage: 'any',
      onlyConflicts: 'any',
    },
    useCount: 5,
    lastUsedAt: new Date(Date.now() - 3600000 * 48),
  },
  {
    name: 'Weekend Feasts',
    criteria: {
      searchQuery: '',
      selectedIngredients: [],
      selectedTags: { occasion: ['Weekend', 'Festive'] },
      matchModePerElement: { ingredients: 'any', tags: 'any', categoryTags: { occasion: 'any' } },
      hasImage: 'any',
      onlyConflicts: 'any',
    },
    useCount: 3,
    lastUsedAt: new Date(Date.now() - 3600000 * 72),
  },
  {
    name: 'Speedy Starters',
    criteria: {
      searchQuery: '',
      maxTotalTime: 20,
      selectedIngredients: [],
      selectedTags: { course: ['appetizer'] },
      matchModePerElement: { ingredients: 'any', tags: 'any', categoryTags: {} },
      hasImage: 'any',
      onlyConflicts: 'any',
    },
    useCount: 1,
    lastUsedAt: new Date(Date.now() - 3600000 * 120),
  },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function seedDev(db: any): Promise<void> {
  const [recipeCount] = await db.select({ value: count() }).from(recipes)
  if (Number(recipeCount.value) === 0) {
    console.log('[Seed:Dev] Seeding 23 realistic culinary recipes with relational ingredients...')

    // 1. First ensure all normalized ingredients exist in ingredients table
    const allNames = Array.from(
      new Set(
        devRecipes.flatMap((r) => r.ingredients.map((i) => i.name.trim())).filter(Boolean)
      )
    )
    for (const name of allNames) {
      await db.insert(ingredients).values({ name }).onConflictDoNothing()
    }

    // 2. Fetch all ingredients to map name -> ingredient_id
    const dbIngredients = await db.select().from(ingredients)
    const ingredientMap = new Map<string, number>()
    for (const ing of dbIngredients) {
      ingredientMap.set(ing.name.toLowerCase(), ing.id)
    }

    // 3. Insert each recipe and its associated recipe_ingredients rows
    for (const r of devRecipes) {
      const { ingredients: recipeIngs, ...recipeFields } = r
      const [insertedRecipe] = await db
        .insert(recipes)
        .values(recipeFields)
        .returning({ id: recipes.id })

      if (insertedRecipe && recipeIngs && recipeIngs.length > 0) {
        for (let sortOrder = 0; sortOrder < recipeIngs.length; sortOrder++) {
          const ingItem = recipeIngs[sortOrder]
          const ingId = ingredientMap.get(ingItem.name.trim().toLowerCase())
          if (ingId) {
            await db.insert(recipeIngredients).values({
              recipeId: insertedRecipe.id,
              ingredientId: ingId,
              amount: ingItem.amount || '',
              unit: ingItem.unit || '',
              sortOrder,
            })
          }
        }
      }
    }
    console.log('[Seed:Dev] 23 development recipes and relational ingredients seeded successfully.')
  }

  // 4. Seed development filter templates if missing
  for (const t of devFilterTemplates) {
    const existing = await db
      .select({ id: filterTemplates.id })
      .from(filterTemplates)
      .where(eq(filterTemplates.name, t.name))

    if (existing.length === 0) {
      await db.insert(filterTemplates).values(t)
    }
  }
}


