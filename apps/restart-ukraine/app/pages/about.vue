<template>
  <div v-if="isLoading" class="flex justify-center items-center h-screen">
    Loading...
  </div>
  <div v-else class="leading-tight mb-24">
    <GeneralizedHeader
      :left-items="headerLinks"
      :right-items="[{ label: 'Взяти участь', color: 'black', to: '/' }]"
      class="z-20"
      logo-src="/restart-logo-icon.svg"
      logo-alt="Restart Agency Logo"
      logo-link="https://www.restartfuture.org/"
    />

    <div class="mt-48 md:w-9/12 md:max-w-[1100px] px-7">
        <img src="/hurtoma-river-01.jpg" alt="" class="w-full rounded-md">
        <h1 class="mt-12 mb-2 text-3xl">Гуртомá</h1>
        <div class="md:w-9/12 space-y-2">
          <p>Платформа від команди дослідників та містопланувальників Restart, яка спрощує комунікацію між містянами та урбаністами. Мета — покращувати міста і спільноти разом.</p>
          <p>Завдяки доступній онлайн мапі, платформа збирає зворотний зв’язок щодо улюблених локації та місць, які потребують покращень. А також враховує побажання уряду, громадських організацій та інших стейкхолдерів.</p>
      </div>
        <div class="flex space-x-2 mt-6">
          <UButton
        class="my-2 py-3 px-6 rounded-full flex place-self-start hover:bg-gray-300 hover:text-black dark:hover:bg-zinc-700 dark:hover:text-white"
        color="black"
        to="/"
      >
      Взяти участь
      </UButton>
      <UButton
        class="my-2 py-3 px-6 rounded-full flex place-self-start bg-gray-300 dark:bg-zinc-600 dark:text-white text-black hover:text-white dark:hover:bg-zinc-700 dark:hover:text-white"
        color="black"
        to="/map/"
      >
      Подивитись результати
      </UButton>
        </div>
          
    </div>

    <UDivider class="mt-24 mb-8" />

    <div class="px-7 md:flex space-y-3 md:space-x-6 md:space-y-0">
      <div class="p-8 border border-zinc-200 dark:border-zinc-600 md:w-56 min-h-full rounded-xl pb-32">
        <h2 class="font-semibold text-xl mb-2">Безпека</h2>
        <p class="text-sm leading-tight">Ми створили цифровий простір, де можна відверто ділитися думками й спогадами про місця, яких уникаєте. Це допоможе привернути увагу спільноти й запустити процес змін.</p>
      </div>
      <div class="p-8 border border-zinc-200 dark:border-zinc-600 md:w-56 min-h-full rounded-xl">
        <h2 class="font-semibold text-xl mb-2">Приналежність</h2>
        <p class="text-sm leading-tight">Стежка до річки, квітучий сквер, культурний центр — позначайте улюблені місця та дізнавайтеся, які локації обирають інші містяни.</p>
      </div>
      <div class="p-8 border border-zinc-200 dark:border-zinc-600 md:w-56 min-h-full rounded-xl">
        <h2 class="font-semibold text-xl mb-2">Середовище</h2>
        <p class="text-sm leading-tight">Завдяки згуртованості містян, онлайн мапа наочно відображає популярні локації та ділянки, які потребують відновлення для процвітання міста.</p>
      </div>
      <div class="p-8 border border-zinc-200 dark:border-zinc-600 md:w-56 min-h-full rounded-xl">
        <h2 class="font-semibold text-xl mb-2">Екологія</h2>
        <p class="text-sm leading-tight">Платформа збирає й систе-матизує дані про рослини та тварин, характерних для місцевості. А також фіксує засмічені зони, які гальмують розвиток міста. Поділитися своїми враженнями — перший крок до покращень.</p>
      </div>
    </div>

    <UDivider class="mt-24 mb-8" />

    <div class="px-7 md:w-9/12 md:max-w-[1100px]">
      <h2 class="mt-12 mb-2 text-3xl">Візія</h2>
      <div class="md:w-9/12 space-y-2 mb-8">
        <p>Річка Тяжилівка, оточена промисловими та військовими районами Вінниці, фактично ізольована від міста. Важкодоступність цієї території заважає мешканцям використовувати її потенціал на користь спільноті.</p>
        <p>Проєкт відновлення «Малі річки Вінниці», в межах якого платформа від Restart стала цифровим партнером, спрямований на відновлення зв'язку між річкою та міським простором. Ініціатива є частиною більшої стратегії Зеленого курсу Вінниці, яку міська рада оголосила в січні 2022 року. Мета — забезпечити сталий розвиток міста через екологічно орієнтовані проєкти та активне залучення інвестицій для покращення інфраструктури.</p>
        <p>Ще одним партнером виступає «Інститут розвитку міст», який вже реалізував кілька важливих проєктів для сталого розвитку Вінниці (один з яких — «Вінницький луг»).</p>
        <p>У випадку з річкою Тяжилівка як першим проєктом, платформа «Гуртомá» дозволить вінничанам самостійно обирати, де прокласти дорогу, створити зону для відпочинку або розчистити територію від зайвого сміття. Зокрема це актуально для жителів віддалених мікрорайонів, які можуть впливати на зміни в один клік.</p>
      </div>
      <img src="/hurtoma-river-02.jpg" alt="" class="w-7/12 rounded-md">
    </div>

    <UDivider class="mt-24 mb-8" />

    <div class="px-7 md:w-9/12 md:max-w-[1100px]">
      <h2 class="mt-12 mb-2 text-3xl">Наші партнери</h2>
      <div class="md:w-9/12 space-y-2 mb-8">
        <p>Програмне забезпечення у цифровій платформі розробила команда Карлоса Сандовала Оласкоага. Він є доцентом кафедри взаємодії людини з комп’ютером (human-computer interaction) та інклюзивного дизайну (inclusive design) в Школі архітектури Північно-Східного університету (School of Architecture at Northeastern University). А також асоційованим доцентом Коледжу комп’ютерних наук Хурі Північно-Східного університету (Khoury College of Computer Sciences at Northeastern University). Зокрема Карлос керує лабораторією масштабованої участі у дизайні (Scalable Design Participation Lab).</p>
        <p>у Північно-Східному університеті й спільно очолює локальну кодову лабораторію (Local Code Lab) в MIT. Його робота поєднує проєктування, обчислення, роботу з міськими даними та державними послугами. Це дозволяє широкому колу спільноти формувати власне цифрове середовище справедливо та цілісно за допомогою обчислювального інтелекту.</p>
      </div>
    </div>

    <UDivider class="mt-24 mb-8" />

    <div class="px-7">
    <div class="md:flex place-items-center justify-between">
      <h1 class="text-2xl leading-tight text-zinc-900 dark:text-white">Drawing Participation<br>Гуртомá</h1>
      <div class="flex space-x-6 md:pr-2 !place-items-center">
        <a href="https://www.northeastern.edu" target="_blank"><img src="/neu-logo-text.svg" alt="Northeastern University Logo" class="hover:scale-105 dark:invert"></a>
        <a href="https://www.restartfuture.org" target="_blank"><img src="/restart-logo-text.svg" alt="Restart Agency Logo" class="hover:scale-105 dark:invert"></a>
        <a href="https://www.facebook.com/SmallRiversVinnytsia" target="_blank"><img src="/river-logo-text.svg" alt="Small Rivers Vinnytsia Project Logo" class="hover:scale-105 dark:invert"></a>
      </div>
    </div>
    <div class="mt-12 md:mt-24 space-y-1 flex flex-col">
      <a href="/" class="hover:underline">Карта</a>
      <a href="/about/" class="hover:underline">Про проєкт</a>
      <a href="/map/" class="hover:underline">Допомога</a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isLoading = ref(true)
const headerLinks = ref([
  { label: 'Drawing Participation', color: 'black', to: '/' },
  { label: 'Гуртомá', color: 'black', to: '/' },
])
const whyContent = ref('')
const secondaryContent = ref('')
const tertiaryContent = ref('')
const tabItems = ref([])
const accordionItems = ref([])
const moreSeriesItems = ref([])

onMounted(async () => {
  try {
    // Simulate API calls
    await Promise.all([
      loadContent(),
      loadTabItems(),
      loadAccordionItems(),
      loadMoreSeriesItems(),
    ])
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    isLoading.value = false
  }
})

async function loadContent() {
  await new Promise((resolve) => setTimeout(resolve, 300))
  whyContent.value = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris erat nisl, maximus et mollis vitae, vulputate vitae tortor. Nunc sed tortor mauris. Aliquam volutpat convallis nulla. Nullam in est sed purus efficitur condimentum eu eget mi. Cras consectetur semper magna eget luctus. Maecenas non elit non mauris varius tempor. Duis placerat luctus fringilla. Sed sit amet nisi a nunc aliquet tincidunt in eget erat. Curabitur quis dolor ac dui volutpat condimentum. Ut feugiat diam sit amet pharetra ultricies. Praesent et posuere nunc. Quisque pharetra facilisis commodo. Etiam id nibh scelerisque, pulvinar sapien a, tempor dolor. Donec suscipit efficitur lacus, vel convallis ligula pellentesque sed. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae;`

  secondaryContent.value = `Quisque consequat diam dui, nec accumsan arcu laoreet a. Sed bibendum neque purus, ac interdum erat posuere dapibus. Quisque commodo felis at posuere imperdiet. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Etiam elementum, arcu id sagittis venenatis, eros nibh ornare ex, eu mollis nunc lectus dictum sem. Quisque eget laoreet elit. Sed egestas sodales odio, at euismod est pharetra non. Nam dui leo, mattis id convallis aliquet, fermentum sed quam. In porttitor, eros id iaculis sollicitudin, tellus augue fringilla nulla, eget suscipit justo sapien convallis erat. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nullam accumsan et magna et molestie.`

  tertiaryContent.value = `Donec pharetra lacus nisl, in pulvinar ante auctor non. Fusce fermentum metus sit amet neque malesuada, eu interdum diam consequat. Phasellus felis tortor, dictum ut augue non, placerat interdum libero. Quisque vitae mollis lectus, pellentesque aliquam urna. Mauris tincidunt aliquet fringilla. Nam malesuada mollis vestibulum. Curabitur malesuada erat sed imperdiet ultrices. Sed nibh turpis, porttitor ut semper eu, ornare eget quam. Nulla facilisi. Ut porta at elit in tempus. Sed quis dapibus eros, eu cursus ipsum. Nam eu libero rutrum, tincidunt nunc at, semper nisl. Sed ullamcorper massa nec est faucibus laoreet. Aliquam erat volutpat.`
}

async function loadTabItems() {
  await new Promise((resolve) => setTimeout(resolve, 300))
  tabItems.value = [
    {
      label: 'Diagram 1',
      icon: 'i-heroicons-chart-bar',
      content: 'Content for Diagram 1',
    },
    {
      label: 'Diagram 2',
      icon: 'i-heroicons-chart-pie',
      content: 'Content for Diagram 2',
    },
    {
      label: 'Diagram 3',
      icon: 'i-heroicons-chart-square-bar',
      content: 'Content for Diagram 3',
    },
    {
      label: 'Diagram 4',
      icon: 'i-heroicons-presentation-chart-line',
      content: 'Content for Diagram 4',
    },
  ]
}

async function loadAccordionItems() {
  await new Promise((resolve) => setTimeout(resolve, 300))
  accordionItems.value = [
    {
      label: 'Reference 1',
      icon: 'i-heroicons-document-text',
      content:
        'Phasellus felis tortor, dictum ut augue non, placerat interdum libero. Quisque vitae mollis lectus, pellentesque aliquam urna.',
    },
    {
      label: 'Reference 2',
      icon: 'i-heroicons-document-text',
      content:
        'Mauris tincidunt aliquet fringilla. Nam malesuada mollis vestibulum. Curabitur malesuada erat sed imperdiet ultrices.',
    },
    {
      label: 'Reference 3',
      icon: 'i-heroicons-document-text',
      content:
        'Sed nibh turpis, porttitor ut semper eu, ornare eget quam. Nulla facilisi. Ut porta at elit in tempus.',
    },
  ]
}

async function loadMoreSeriesItems() {
  await new Promise((resolve) => setTimeout(resolve, 300))
  moreSeriesItems.value = [
    {
      title: 'Why',
      description: 'Explore the reasons behind our project',
      icon: 'i-heroicons-question-mark-circle',
    },
    {
      title: 'What',
      description: 'Discover what our project offers',
      icon: 'i-heroicons-information-circle',
    },
    {
      title: 'How',
      description: 'Learn how to use our tools effectively',
      icon: 'i-heroicons-academic-cap',
    },
  ]
}
</script>
