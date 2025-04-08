<script setup lang="ts">
</script>
<template>
    <div class="fixed inset-0 left-1/2 top-1/2 w-[60%] max-w-[1800px] flex flex-col gap-5 overflow-hidden rounded-lg bg-transparent z-10 -translate-x-1/2 -translate-y-1/2">
            <UCard class="flex-shrink-0 bg-white rounded-lg shadow-md hover:shadow-lg">
                <template #header>
                    <div class="flex flex-col md:flex-row justify-between gap-10">
                        <!-- Left Column -->
                        <div class="flex flex-col justify-start items-start md:w-2/4 w-full">
                            <div class="h-4 flex justify-start items-end gap-1.5">
                                <div class="text-black text-base font-medium">Khayelitsha</div>
                                <div class="text-neutral-400 text-xs font-medium">Urban Analysis</div>
                            </div>
                            <div class="w-full text-black text-xs font-medium">
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                                incididunt ut labore et dolore magna aliqua.
                            </div>
                            <div class="w-full text-black text-xs font-medium">
                                → Upload Data<br />→ Switch Project
                            </div>
                        </div>

                        <!-- Right Column -->
                        <div class="flex flex-col justify-start items-start md:w-2/4 lg:w-1/4 w-full">
                            <div class="flex flex-col md:flex-row justify-between gap-4 w-full">
                                <div
                                    class="w-full md:w-36 h-36 px-4 py-4 bg-white rounded-lg shadow-lg flex flex-col justify-center items-center">
                                    <div class="text-center text-black text-xl font-medium leading-10">2</div>
                                    <div class="text-center text-neutral-400 text-sm font-medium">Data Sets</div>
                                </div>
                                <div
                                    class="w-full md:w-36 h-36 px-4 py-4 bg-white rounded-[10px] shadow-lg flex flex-col justify-center items-center">
                                    <div class="text-center text-black text-xl font-medium leading-10">457</div>
                                    <div class="text-center text-neutral-400 text-sm font-medium">Data Entries</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </UCard>

            <div class="flex-grow overflow-y-auto h-fit">
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                    <div v-for="(item, index) in ['points', 'grid', 'heatmap', 'tesselation', 'buffer', 'interpolate']"
                        :key="index"
                        class="px-3 py-3 bg-neutral-50 rounded-lg flex flex-col justify-start items-start gap-3 shadow-md hover:shadow-lg">
                        <div class="w-full flex justify-between items-center">
                            <div class="h-4 flex justify-start items-center gap-1.5">
                                <div class="text-black text-base font-medium capitalize">{{ item }}</div>
                            </div>
                            <div class="w-6 h-5 text-right text-black text-base font-medium">
                                <NuxtLink :to="`/${item}`">
                                    ↗
                                </NuxtLink></div>
                        </div>
                        <img class="w-full h-40 rounded-[5px] object-cover" src="https://placehold.co/329x237" />
                    </div>
                </div>
            </div>
        </div>
    <GeneralizedBackgroundMap ref="baseMap" /> 

</template>