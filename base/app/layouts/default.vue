<!-- Minimal app shell. Apps override this file when they need more; manifest
     apps put their chrome (header, footer) in the shell spec instead. -->
<template>
  <div>
    <NuxtLoadingIndicator />
    <slot />
    <UNotifications />
    <UModals />
  </div>
</template>
