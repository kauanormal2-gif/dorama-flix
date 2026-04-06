import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@dramaflix.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@dramaflix.com",
      password: adminPassword,
      role: "admin",
    },
  });
  console.log(`Admin created: ${admin.email} (senha: admin123)`);

  // Create categories
  const categoriesData = [
    { name: "Romance", slug: "romance" },
    { name: "Drama", slug: "drama" },
    { name: "Ação", slug: "acao" },
    { name: "Comédia", slug: "comedia" },
    { name: "Suspense", slug: "suspense" },
    { name: "Fantasia", slug: "fantasia" },
  ];

  const categories: Record<string, string> = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categories[cat.slug] = created.id;
  }
  console.log(`${categoriesData.length} categories created`);

  // Create sample movies
  const moviesData = [
    {
      title: "Amor em Velocidades Perigosas",
      slug: "amor-em-velocidades-perigosas",
      description: "Uma história emocionante de amor que se desenvolve entre dois rivais do mundo das corridas de rua. Quando a velocidade encontra a paixão, nada pode parar seus corações.",
      thumbnail: "https://picsum.photos/seed/dorama1/400/600",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      bannerUrl: "https://picsum.photos/seed/dorama1-banner/1920/1080",
      year: 2024,
      duration: "1h 45min",
      rating: 8.5,
      featured: true,
      status: "active",
      cats: ["romance", "acao"],
    },
    {
      title: "Meu Marido Secreto é Meu Chefe",
      slug: "meu-marido-secreto-e-meu-chefe",
      description: "Após um casamento arranjado secreto, ela descobre que seu misterioso marido é ninguém menos que o CEO implacável da empresa onde trabalha.",
      thumbnail: "https://picsum.photos/seed/dorama2/400/600",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      bannerUrl: "https://picsum.photos/seed/dorama2-banner/1920/1080",
      year: 2024,
      duration: "2h 10min",
      rating: 9.0,
      featured: false,
      status: "active",
      cats: ["romance", "drama"],
    },
    {
      title: "A Herdeira Retorna",
      slug: "a-herdeira-retorna",
      description: "Após anos no exílio, a herdeira de uma das famílias mais poderosas retorna para reclamar o que é seu por direito. Mas antigos inimigos estão à espreita.",
      thumbnail: "https://picsum.photos/seed/dorama3/400/600",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      bannerUrl: "https://picsum.photos/seed/dorama3-banner/1920/1080",
      year: 2023,
      duration: "1h 55min",
      rating: 8.8,
      featured: false,
      status: "active",
      cats: ["drama", "suspense"],
    },
    {
      title: "Divorciada no Dia do Casamento",
      slug: "divorciada-no-dia-do-casamento",
      description: "No dia do seu casamento, ela descobre a traição do noivo e decide começar uma nova vida. O que ela não esperava era encontrar o amor verdadeiro logo depois.",
      thumbnail: "https://picsum.photos/seed/dorama4/400/600",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      year: 2024,
      duration: "1h 30min",
      rating: 8.2,
      featured: false,
      status: "active",
      cats: ["romance", "drama"],
    },
    {
      title: "O Falso Casamento de Dois Chefes",
      slug: "o-falso-casamento-de-dois-chefes",
      description: "Dois CEOs rivais são forçados a fingir um casamento para salvar suas empresas. Mas o que começa como farsa rapidamente se torna algo muito real.",
      thumbnail: "https://picsum.photos/seed/dorama5/400/600",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      year: 2024,
      duration: "2h 05min",
      rating: 8.7,
      featured: false,
      status: "active",
      cats: ["romance", "comedia"],
    },
    {
      title: "A Vida Secreta do Meu Marido Bilionário",
      slug: "a-vida-secreta-do-meu-marido-bilionario",
      description: "Ela achava que tinha se casado com um homem simples. Mas seu marido esconde um império bilionário e segredos que podem destruir tudo.",
      thumbnail: "https://picsum.photos/seed/dorama6/400/600",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
      bannerUrl: "https://picsum.photos/seed/dorama6-banner/1920/1080",
      year: 2023,
      duration: "1h 50min",
      rating: 9.2,
      featured: true,
      status: "active",
      cats: ["romance", "suspense"],
    },
    {
      title: "Casamento Blindado",
      slug: "casamento-blindado",
      description: "Um casamento por contrato entre um herdeiro milionário e uma garota simples. Mas quando os sentimentos se tornam reais, tudo muda.",
      thumbnail: "https://picsum.photos/seed/dorama7/400/600",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
      year: 2024,
      duration: "1h 40min",
      rating: 8.4,
      featured: false,
      status: "active",
      cats: ["romance"],
    },
    {
      title: "A Científista Secreta",
      slug: "a-cientista-secreta",
      description: "Uma brilhante cientista esconde sua verdadeira identidade para trabalhar em um laboratório secreto. Quando seus experimentos dão errado, ela precisa lutar pela sobrevivência.",
      thumbnail: "https://picsum.photos/seed/dorama8/400/600",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
      year: 2023,
      duration: "2h 00min",
      rating: 8.1,
      featured: false,
      status: "active",
      cats: ["drama", "suspense", "fantasia"],
    },
    {
      title: "Caso Encerrado: O Retorno da Rainha Jurídica",
      slug: "caso-encerrado-o-retorno-da-rainha-juridica",
      description: "A melhor advogada do país volta após 5 anos afastada para enfrentar o caso mais difícil da sua carreira. Justiça será feita.",
      thumbnail: "https://picsum.photos/seed/dorama9/400/600",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      year: 2024,
      duration: "1h 35min",
      rating: 8.9,
      featured: false,
      status: "active",
      cats: ["drama", "suspense"],
    },
    {
      title: "Namorado Oficial",
      slug: "namorado-oficial",
      description: "Para se livrar de um pretendente inconveniente, ela contrata um ator desconhecido para ser seu namorado falso. Mas a ficção vira realidade.",
      thumbnail: "https://picsum.photos/seed/dorama10/400/600",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      year: 2024,
      duration: "1h 25min",
      rating: 8.6,
      featured: false,
      status: "active",
      cats: ["romance", "comedia"],
    },
    {
      title: "A Dama Chefe: Da Traída a Amada",
      slug: "a-dama-chefe-da-traida-a-amada",
      description: "Após ser traída e humilhada, ela se reinventa e se torna uma empresária de sucesso. Agora, todos que a desprezaram imploram por sua atenção.",
      thumbnail: "https://picsum.photos/seed/dorama11/400/600",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      year: 2023,
      duration: "1h 50min",
      rating: 8.3,
      featured: false,
      status: "active",
      cats: ["drama", "romance"],
    },
    {
      title: "Conquistei um Bilionário Para Ser Meu Marido",
      slug: "conquistei-um-bilionario-para-ser-meu-marido",
      description: "Uma aposta inocente a coloca frente a frente com o bilionário mais cobiçado do país. O que começou como um jogo pode se tornar o amor da sua vida.",
      thumbnail: "https://picsum.photos/seed/dorama12/400/600",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      bannerUrl: "https://picsum.photos/seed/dorama12-banner/1920/1080",
      year: 2024,
      duration: "2h 15min",
      rating: 9.1,
      featured: false,
      status: "active",
      cats: ["romance", "comedia"],
    },
  ];

  for (const movieData of moviesData) {
    const { cats, ...data } = movieData;
    const movie = await prisma.movie.upsert({
      where: { slug: data.slug },
      update: {},
      create: data,
    });

    for (const slug of cats) {
      const categoryId = categories[slug];
      if (categoryId) {
        await prisma.movieCategory.upsert({
          where: { movieId_categoryId: { movieId: movie.id, categoryId } },
          update: {},
          create: { movieId: movie.id, categoryId },
        });
      }
    }
  }
  console.log(`${moviesData.length} movies created`);

  // Create site settings
  await prisma.siteSettings.upsert({
    where: { id: "main" },
    update: {},
    create: {
      id: "main",
      siteName: "Dorama Flix",
      siteTagline: "Filmes e Séries Asiáticas",
      primaryColor: "#e50914",
    },
  });
  console.log("Site settings created");

  console.log("\n✅ Seed completed!");
  console.log("Admin login: admin@dramaflix.com / admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
