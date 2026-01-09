(function() {

    console.log("[BOT] Starting Adventure Auto Bot...");
    window.confirm = () => true

    /******************************
     * CONFIG
     ******************************/

    const ACTION_INTERVAL = 500; // 0.5 seconds
    const LOG_INTERVAL = 30 * 1000; // 30 seconds

    const HP_THRESHOLD_SHORT = 0.7;  // Short Rest when HP < 70%
    const HP_THRESHOLD_LONG = 0.3;  // Long Rest when HP < 30%

    const AUTO_ENHANCE_ITEMS = true;
    const SAFE_ENHANCE_LEVEL = 4;
    const HEALTH_PER_ATTACK_POWER = 3;
    
    const AUTO_DELETE_ITEM = true
    const KEEP_BEST_OF_EACH_TYPE_AMOUNT = 3;

    const AUTO_BOSS_FIGHT = false;
    const BOSS_WINRATE_SETTING = 0.85;

    const AUTO_GATCHA = true;

    const DEBUG = false;


    /******************************
     * GAME CONSTANTS
     ******************************/

    const ITEM_TYPES = {
        "WEAPON": "武器",
        "ARMOR": "防具",
        "ACCESSORY": "飾品"
    }

    const RARITY_RANKING = {
        "普通": 1,
        "稀有": 2,
        "史詩": 3,
        "傳說": 4
    };

    const ENHANCE_ITEM_MULTIPLIER = 0.1;

    const PLAYER_LEVEL_TAG = "#player-level";
    const HEALTH_TAG = "#health-text";
    const ACTIVITY_PROGRESS_BAR_TAG = "#activity-progress";

    const EQUIPMENT_DETAIL_MODEL_TAG = "#equipment-detail-modal";
    const EQUIPMENT_DETAIL_NAME_TAG = "#equipment-name";
    const EQUIPMENT_DETAIL_ATK_TAG = "#attack-bonus .stat-value";
    const EQUIPMENT_DETAIL_DEF_TAG = "#health-bonus .stat-value";
    const EQUIPMENT_DETAIL_RARITY_TAG = "#equipment-rarity";
    const EQUIPMENT_DETAIL_TYPE_TAG = "#equipment-type";
    const EQUIPMENT_DETAIL_ENHANCE_LEVEL_TAG = "#equipment-enhance-level";
    const EQUIPMENT_DETAIL_REQUIRED_LEVEL_TAG = "#equipment-required-level"

    const UPGRADE_SCROLL_COUNT_TAG = "#scroll-count";

    const EQUIPED_WEAPON_TAG = "#weapon-slot";
    const EQUIPED_ARMOR_TAG = "#armor-slot";
    const EQUIPED_ACCESSORY_TAG = "#accessory-slot";

    const CLOSE_EQUIPMENT_BUTTON_TAG = "#close-equipment-detail";
    const EQUIP_BUTTON_TAG = "#equip-item";
    const DELETE_ITEM_TAG = "#delete-item";
    const ENHANCE_ITEM_TAG = "#enhance-equipment";

    const SHORT_REST_BUTTON_TAG = "#short-rest";
    const LONG_REST_BUTTON_TAG = "#long-rest";
    const DEEP_ADVENTURE_TAG = "#deep-adventure"
    const SIMPLE_ADVENTURE_TAG = "#simple-adventure"
    const RESOURCE_ADVENTURE_TAG = "#resource-adventure";
    const BOSS_CHALLENGE_TAG = "#boss-challenge";
    const CONFIRM_BOSS_CHALLENGE_TAG = "#confirm-boss-challenge";
    const CANCLE_BOSS_CHALLENGE_TAG = "#cancel-boss-challenge";

    const BOSS_WINRATE_TAG = "#win-chance";

    const INVENTORY_TAG = "#inventory-items"

    /******************************
     * HELPERS TO GET GAME STATE
     ******************************/

    function getPlayerLevel() {
        let levelText = document.querySelector(PLAYER_LEVEL_TAG);
        if (!levelText) {
            console.log("[BOT ERROR] UNABLE TO READ PLAYER LEVEL");
            return 1; // fallback to safe value
        }

        return Number(levelText.textContent);
    }

    function getHPRatio() {
        let hpText = document.querySelector(HEALTH_TAG);
        if (!hpText) {
            console.log("[BOT ERROR] UNABLE TO READ HEALTH POINT");
            return 1; // fallback to safe value
        }

        let [current, max] = hpText.textContent.trim().split("/").map(Number);
        return current / max;
    }

    function getScrollCount(){
        return Number(document.querySelector(UPGRADE_SCROLL_COUNT_TAG).textContent);
    }

    function isActivityRunning() {
        const bar = document.querySelector(ACTIVITY_PROGRESS_BAR_TAG);
        if (!bar) {
            console.log("[BOT ERROR] UNABLE TO READ ACTIVITY PROGRESS BAR");
            return false;
        }
        return bar.style.display != "none";
    }

    function isButtonWithTagDisabled(buttonTag) {
        const button = document.querySelector(buttonTag);
        if (!button) {
            console.log("[BOT ERROR] UNABLE TO FIND ELEMENT WITH TAG: ", buttonTag);
            return true;
        } else {
            return button.disabled;
        }
    }

    function isModelWithTagHidden(modelTag) {
        const model = document.querySelector(modelTag);
        if (!model) {
            console.log("[BOT ERROR] UNABLE TO FIND MODEL WITH TAG: ", modelTag);
            return true;
        } else {
            return model.style.cssText == "display: none;";
        }
    }

    function calculateBaseItemStats(enhanceLvl, enhancedStat){
        return enhancedStat / (1 + enhanceLvl * ENHANCE_ITEM_MULTIPLIER);
    }

    function getOpenedEquipmentStat() {
        const nameEl = document.querySelector(EQUIPMENT_DETAIL_NAME_TAG);
        const attackEl = document.querySelector(EQUIPMENT_DETAIL_ATK_TAG);
        const defenceEl = document.querySelector(EQUIPMENT_DETAIL_DEF_TAG);
        const rarityEl = document.querySelector(EQUIPMENT_DETAIL_RARITY_TAG);
        const typeEl = document.querySelector(EQUIPMENT_DETAIL_TYPE_TAG);
        const enhanceLevelEl = document.querySelector(EQUIPMENT_DETAIL_ENHANCE_LEVEL_TAG);
        const requiredLevelEl = document.querySelector(EQUIPMENT_DETAIL_REQUIRED_LEVEL_TAG);

        let itemStat = 0;

        let currentEquipmentStats = {
            "name": null,
            "rarity": null,
            "type": null,
            "enhancedStat": 0,
            "baseStat": 0,
            "enhanceLevel": 0,
            "requiredLevel": 0
        }

        if (!typeEl) {
            console.log("[BOT ERROR] UNABLE TO READ OPENED ITEM STAT: TYPE");
            return currentEquipmentStats;
        } else {
            currentEquipmentStats["type"] = typeEl.textContent;
        }

        if (currentEquipmentStats["type"] == ITEM_TYPES["WEAPON"]) {
            if (!attackEl) {
                console.log("[BOT ERROR] UNABLE TO READ OPENED ITEM STAT: ATTACK BONUS");
                return currentEquipmentStats;
            } else {
                itemStat = Number(attackEl.textContent);
            }
        } else if (currentEquipmentStats["type"] == ITEM_TYPES["ARMOR"]) {
            if (!defenceEl) {
                console.log("[BOT ERROR] UNABLE TO READ OPENED ITEM STAT: HEALTH BONUS");
                return currentEquipmentStats;
            } else {
                itemStat = Number(defenceEl.textContent);
            }
        } else if (currentEquipmentStats["type"] == ITEM_TYPES["ACCESSORY"]) {
            if (!attackEl) {
                console.log("[BOT ERROR] UNABLE TO READ OPENED ITEM STAT: ATTACK BONUS");
                return currentEquipmentStats;
            } else if (!defenceEl) {
                console.log("[BOT ERROR] UNABLE TO READ OPENED ITEM STAT: HEALTH BONUS");
                return currentEquipmentStats;
            } else {
                itemStat = Number(attackEl.textContent) * HEALTH_PER_ATTACK_POWER + Number(defenceEl.textContent);
            }
        }

        if (!nameEl) {
            console.log("[BOT ERROR] UNABLE TO READ OPENED ITEM STAT: NAME");
        } else {
            currentEquipmentStats["name"] = nameEl.textContent;
        }

        if (!rarityEl) {
            console.log("[BOT ERROR] UNABLE TO READ OPENED ITEM STAT: RARITY");
        } else {
            currentEquipmentStats["rarity"] = rarityEl.textContent;
        }

        if (!enhanceLevelEl) {
            console.log("[BOT ERROR] UNABLE TO READ OPENED ITEM STAT: ENHANCE LEVEL");
            return currentEquipmentStats;
        } else {
            currentEquipmentStats["enhanceLevel"] = Number(enhanceLevelEl.textContent);
        }

        if (!requiredLevelEl) {
            console.log("[BOT ERROR] UNABLE TO READ OPENED ITEM STAT: REQUIRED LEVEL");
        } else {
            currentEquipmentStats["requiredLevel"] = Number(requiredLevelEl.textContent);
        }

        currentEquipmentStats["enhancedStat"] = itemStat;
        currentEquipmentStats["baseStat"] = calculateBaseItemStats(Number(enhanceLevelEl.textContent), itemStat);

        return currentEquipmentStats;
    }

    function getEquipedItemsStats() {
        let currentEquipmentStats = {
            "currentWeapon": null,
            "currentArmor": null,
            "currentAccessory": null
        }

        const weaponEl = document.querySelector(EQUIPED_WEAPON_TAG);
        const armorEl = document.querySelector(EQUIPED_ARMOR_TAG);
        const accessoryEl = document.querySelector(EQUIPED_ACCESSORY_TAG);
        
        if (!weaponEl){
            console.log("[BOT ERROR] UNABLE TO READ EQUIPED WEAPON STAT");
        } else {
            if (!weaponEl.classList.contains("emtpy")) {
                weaponEl.click();
                currentEquipmentStats["currentWeapon"] = getOpenedEquipmentStat();
                clickElementWithTag(CLOSE_EQUIPMENT_BUTTON_TAG);
            }
        }

        if (!armorEl){
            console.log("[BOT ERROR] UNABLE TO READ EQUIPED ARMOR STAT");
        } else {
            if (!armorEl.classList.contains("emtpy")) {
                armorEl.click();
                currentEquipmentStats["currentArmor"] = getOpenedEquipmentStat();
                clickElementWithTag(CLOSE_EQUIPMENT_BUTTON_TAG);
            }
        }

        if (!accessoryEl){
            console.log("[BOT ERROR] UNABLE TO READ EQUIPED ACCESSORY STAT");
        } else {
            if (!accessoryEl.classList.contains("emtpy")) {
                accessoryEl.click();
                currentEquipmentStats["currentAccessory"] = getOpenedEquipmentStat();
                clickElementWithTag(CLOSE_EQUIPMENT_BUTTON_TAG);
            }
        }
        if (DEBUG){
            console.log("[BOT DEBUG] Checked Current Equipment Stats:", currentEquipmentStats);
        }
        return currentEquipmentStats;
    }

    function getLowestEquipedLevel(){
        const equipedItemsStats = getEquipedItemsStats();
        let minLevel = Infinity;

        for (const stat of Object.values(equipedItemsStats)){
            if (stat) {
                if(stat["enhanceLevel"] != null) {
                    minLevel = Math.min(minLevel, stat["enhanceLevel"]);
                }
            }
        }
        return minLevel;
    }

    function clickElementWithTag(tag) {
        const element = document.querySelector(tag);
        if (!element) {
            console.log("[BOT ERROR] UNABLE TO FIND ELEMENT WITH TAG: ", tag);
            return false;
        } else {
            element.click();
            return true;
        }
    }

    /******************************
     * MAIN FUNCTIONS
     ******************************/

    // Decide what action to take
    function chooseAdventure() {
        if (DEBUG){
            console.log("[BOT DEBUG] Deciding adventure...");
        }
        
        const hpRatio = getHPRatio();

        // Long rest if below 30% health
        if (hpRatio < HP_THRESHOLD_LONG) {
            console.log(`[BOT] HP low (${Math.round(hpRatio*100)}%). Long Resting.`);
            if (clickElementWithTag(LONG_REST_BUTTON_TAG)){
                return;
            }
        }
        
        // Short rest if below 70% health
        if (hpRatio < HP_THRESHOLD_SHORT) {
            console.log(`[BOT] HP semi-low (${Math.round(hpRatio*100)}%). Short Resting.`);
            if (clickElementWithTag(SHORT_REST_BUTTON_TAG)){
                return;
            }
        }

        // Go into boss fight if the win-rate is higher than the set level
        if (AUTO_BOSS_FIGHT && !isButtonWithTagDisabled(BOSS_CHALLENGE_TAG)) {
            clickElementWithTag(BOSS_CHALLENGE_TAG)

            let bossWinrateEl = document.querySelector(BOSS_WINRATE_TAG);

            if (!bossWinrateEl) {
                console.log("[BOT ERROR] UNABLE TO FIND BOSS WINRATE STAT");
            } else {
                try {
                    // Extract the number inside parentheses
                    let winRate = Number(bossWinrateEl.textContent.match(/\((\d+)%\)/)[1]) / 100;
                    
                    if (winRate >= BOSS_WINRATE_SETTING) {
                        console.log("[BOT] Win-rate is ", winRate * 100, "%, starting boss fight");
                        if(clickElementWithTag(CONFIRM_BOSS_CHALLENGE_TAG)){
                            return;
                        }
                    } else {
                        console.log("[BOT] Win-rate is ", winRate * 100, "%, aborting boss fight");
                        clickElementWithTag(CANCLE_BOSS_CHALLENGE_TAG);
                    }
                } catch {
                    console.log("[BOT ERROR] BOSS WINRATE STAT UNREADABLE");
                }
                
            }
        }
        
        // Go to resource adventure if current equipment is not yet +5
        if (getLowestEquipedLevel() <= SAFE_ENHANCE_LEVEL && getPlayerLevel() >= 10) {
            if (clickElementWithTag(RESOURCE_ADVENTURE_TAG)) {
                console.log("[BOT] Starting Resource Adventure");
                return
            }
        }

        // Deep adventure if player level is greater than 3
        if (getPlayerLevel() >= 3){
            console.log("[BOT] Starting Deep Adventure");
            if (clickElementWithTag(DEEP_ADVENTURE_TAG)){
                return;
            }
        }

        // Default to simple adventure
        console.log("[BOT] Starting Simple Adventure");
        clickElementWithTag(SIMPLE_ADVENTURE_TAG);
        return;
    }

    function equipBestInSlot(){
        if (DEBUG){
            console.log("[BOT DEBUG] Checking best in slot item...");
        }

        const currentPlayerLevel = getPlayerLevel();
        let currentEquipmentStats = getEquipedItemsStats();
        let currentSelectedItemStat = null;

        let inventory = document.querySelector(INVENTORY_TAG);
        if (!inventory){
            console.log("[BOT ERROR] UNABLE TO READ INVENTORY");
            return;
        }
        let currentInventoryItems = inventory.children;

        let bestItem = {
            "bestWeaponAtk": 0,
            "bestWeaponPos": -1,
            "bestArmorDef": 0,
            "bestArmorPos": -1,
            "bestAccessoryStat": 0,
            "bestAccessoryPos": -1
        };

        if (currentEquipmentStats["currentWeapon"]) {
            bestItem["bestWeaponAtk"] = currentEquipmentStats["currentWeapon"]["enhancedStat"];
        }

        if (currentEquipmentStats["currentArmor"]) {
            bestItem["bestArmorDef"] = currentEquipmentStats["currentArmor"]["enhancedStat"];
        }

        if (currentEquipmentStats["currentAccessory"]) {
            bestItem["bestAccessoryStat"] = currentEquipmentStats["currentAccessory"]["enhancedStat"] * HEALTH_PER_ATTACK_POWER + currentEquipmentStats["currentAccessory"]["enhancedStat"];
        }

        // Compare Item Stats
        for (let i = 0; i < currentInventoryItems.length; i++) {
            currentInventoryItems[i].click();
            if (isModelWithTagHidden(EQUIPMENT_DETAIL_MODEL_TAG)){
                continue;
            }

            currentSelectedItemStat = getOpenedEquipmentStat();

            // Ignore if the equipment is too high-level
            if (currentSelectedItemStat["requiredLevel"] > currentPlayerLevel){
                clickElementWithTag(CLOSE_EQUIPMENT_BUTTON_TAG);
                continue;
            }
            
            // Store item stat and position if its stat is better
            if (currentSelectedItemStat["type"] == ITEM_TYPES["WEAPON"]) {
                if (currentSelectedItemStat["enhancedStat"] > bestItem["bestWeaponAtk"]) {
                    bestItem["bestWeaponAtk"] = currentSelectedItemStat["enhancedStat"];
                    bestItem["bestWeaponPos"] = i;
                }
            } else if (currentSelectedItemStat["type"] == ITEM_TYPES["ARMOR"]) {
                if (currentSelectedItemStat["enhancedStat"] > bestItem["bestArmorDef"]) {
                    bestItem["bestArmorDef"] = currentSelectedItemStat["enhancedStat"];
                    bestItem["bestArmorPos"] = i;
                }
            } else if (currentSelectedItemStat["type"] == ITEM_TYPES["ACCESSORY"]) {
                if (currentSelectedItemStat["enhancedStat"] * HEALTH_PER_ATTACK_POWER + currentSelectedItemStat["enhancedStat"] > bestItem["bestAccessoryStat"]) {
                    bestItem["bestAccessoryStat"] = currentSelectedItemStat["enhancedStat"] * HEALTH_PER_ATTACK_POWER + currentSelectedItemStat["enhancedStat"];
                    bestItem["bestAccessoryPos"] = i;
                }
            }
            clickElementWithTag(CLOSE_EQUIPMENT_BUTTON_TAG);
        }

        // Sort by descending order
        let toBeEquip = [bestItem["bestWeaponPos"], bestItem["bestArmorPos"], bestItem["bestAccessoryPos"]];
        toBeEquip = toBeEquip.filter(n => n >= 0).sort((a, b) => b - a);
        for (const pos of toBeEquip){
            currentInventoryItems[pos].click();
            if (clickElementWithTag(EQUIP_BUTTON_TAG)){
                console.log("[BOT] Equipped New Item"); // TO-DO: add item name
            }
        }
    }

    function deleteWorseItems() {
        if (!AUTO_DELETE_ITEM) {
            return;
        }

        if (DEBUG){
            console.log("[BOT DEBUG] Deleting worse items...");
        }
        
        const currentPlayerLevel = getPlayerLevel();
        let currentSelectedItemStat = null;
        let currentEquipmentStats = getEquipedItemsStats();

        let currentWeaponBaseStat = 0;
        let currentArmorBaseStat = 0;
        let currentAccessoryBaseStat = 0;

        if (currentEquipmentStats["currentWeapon"] != null) {
            currentWeaponBaseStat = currentEquipmentStats["currentWeapon"]["baseStat"];
        }

        if (currentEquipmentStats["currentArmor"] != null) {
            currentArmorBaseStat = currentEquipmentStats["currentArmor"]["baseStat"];
        }

        if (currentEquipmentStats["currentAccessory"] != null) {
            currentAccessoryBaseStat = currentEquipmentStats["currentAccessory"]["baseStat"];
        }

        let inventory = document.querySelector(INVENTORY_TAG);
        if (!inventory){
            console.log("[BOT ERROR] UNABLE TO READ INVENTORY");
            return;
        }
        let currentInventoryItems = inventory.children;

        let allWeapons = {};
        let allArmors = {};
        let allAccessory = {};
        let toBeDelete = [];

        // Store Item Stats
        for (let i = 0; i < currentInventoryItems.length; i++) {
            currentInventoryItems[i].click();
            if (isModelWithTagHidden(EQUIPMENT_DETAIL_MODEL_TAG)){
                continue;
            }

            currentSelectedItemStat = getOpenedEquipmentStat();

            // Ignore if the equipment is too high-level
            if (currentSelectedItemStat["requiredLevel"] > currentPlayerLevel){
                clickElementWithTag(CLOSE_EQUIPMENT_BUTTON_TAG);
                continue;
            }

            // Store item if its base stat is lower than current equipped item
            if (currentSelectedItemStat["type"] == ITEM_TYPES["WEAPON"]) {
                if (currentSelectedItemStat["baseStat"] <= currentWeaponBaseStat){
                    allWeapons[i] = currentSelectedItemStat["baseStat"];
                }
            } else if (currentSelectedItemStat["type"] == ITEM_TYPES["ARMOR"]) {
                if (currentSelectedItemStat["baseStat"] <= currentArmorBaseStat){
                    allArmors[i] = currentSelectedItemStat["baseStat"];
                }
            } else if (currentSelectedItemStat["type"] == ITEM_TYPES["ACCESSORY"]) {
                if (currentSelectedItemStat["baseStat"] <= currentAccessoryBaseStat){
                    allAccessory[i] = currentSelectedItemStat["baseStat"];
                }
            }
            clickElementWithTag(CLOSE_EQUIPMENT_BUTTON_TAG);
        }

        for (const l of [allWeapons, allArmors, allAccessory]) {
            if (Object.keys(l).length > KEEP_BEST_OF_EACH_TYPE_AMOUNT) {
                const remainingKeys = Object.entries(l)
                    .sort((a, b) => b[1] - a[1])
                    .slice(KEEP_BEST_OF_EACH_TYPE_AMOUNT)
                    .map(([key]) => Number(key)); // ensure numeric index

                toBeDelete.push(...remainingKeys);
            }
        }

        toBeDelete.sort((a, b) => b - a);

        for (const pos of toBeDelete) {
            currentInventoryItems[pos].click();

            if (clickElementWithTag(DELETE_ITEM_TAG)) {
                console.log("[BOT] Deleted Item");
            } else {
                console.log("[BOT ERROR] UNABLE TO DELETE ITEM");
                clickElementWithTag(CLOSE_EQUIPMENT_BUTTON_TAG);
            }
        }
    }

    function safelyEnhanceItems(){
        if (!AUTO_ENHANCE_ITEMS) {
            return false;
        }

        if (DEBUG) {
            console.log("[BOT DEBUG] Leveling up items...");
        }
        

        if (getScrollCount() == 0){
            if (DEBUG) {
                console.log("[BOT DEBUG] Currently has no scrolls");
            }
            return false;
        }

        const equipedItemsStats = getEquipedItemsStats();
        
        const currentWeapon = equipedItemsStats["currentWeapon"];
        const currentArmor = equipedItemsStats["currentArmor"];
        const currentAccessory = equipedItemsStats["currentAccessory"];

        let toBeUpgradeWeapon = {
            "baseStat": 0,
            "enhanceLevel": 0,
            "requiredLevel": -1,
            "position": null
        }

        let toBeUpgradeArmor = {
            "baseStat": 0,
            "enhanceLevel": 0,
            "requiredLevel": -1,
            "position": null
        }

        let toBeUpgradeAccessory = {
            "baseStat": 0,
            "enhanceLevel": 0,
            "requiredLevel": -1,
            "position": null
        }

        if (currentWeapon != null) {
            toBeUpgradeWeapon["baseStat"] = currentWeapon["baseStat"];
            toBeUpgradeWeapon["enhanceLevel"] = currentWeapon["enhanceLevel"];
            toBeUpgradeWeapon["requiredLevel"] = currentWeapon["requiredLevel"];
            toBeUpgradeWeapon["position"] = -1;
        }

        if (currentArmor != null) {
            toBeUpgradeArmor["baseStat"] = currentArmor["baseStat"];
            toBeUpgradeArmor["enhanceLevel"] = currentArmor["enhanceLevel"];
            toBeUpgradeArmor["requiredLevel"] = currentArmor["requiredLevel"];
            toBeUpgradeArmor["position"] = -2;
        }

        if (currentAccessory != null) {
            toBeUpgradeAccessory["baseStat"] = currentAccessory["baseStat"];
            toBeUpgradeAccessory["enhanceLevel"] = currentAccessory["enhanceLevel"];
            toBeUpgradeAccessory["requiredLevel"] = currentAccessory["requiredLevel"];
            toBeUpgradeAccessory["position"] = -3;
        }

        let inventory = document.querySelector(INVENTORY_TAG);
        if (!inventory){
            console.log("[BOT ERROR] UNABLE TO READ INVENTORY");
            return;
        }
        let currentInventoryItems = inventory.children;


        for (let i = 0; i < currentInventoryItems.length; i++) {
            currentInventoryItems[i].click();

            if (isModelWithTagHidden(EQUIPMENT_DETAIL_MODEL_TAG)){
                continue;
            }

            currentSelectedItemStat = getOpenedEquipmentStat();

            if (currentSelectedItemStat["type"] == ITEM_TYPES["WEAPON"] && currentSelectedItemStat["baseStat"] > toBeUpgradeWeapon["baseStat"]) {
                toBeUpgradeWeapon["baseStat"] = currentSelectedItemStat["baseStat"];
                toBeUpgradeWeapon["enhanceLevel"] = currentSelectedItemStat["enhanceLevel"];
                toBeUpgradeWeapon["requiredLevel"] = currentSelectedItemStat["requiredLevel"];
                toBeUpgradeWeapon["position"] = i;
            } else if (currentSelectedItemStat["type"] == ITEM_TYPES["ARMOR"] && currentSelectedItemStat["baseStat"] > toBeUpgradeArmor["baseStat"]) {
                toBeUpgradeArmor["baseStat"] = currentSelectedItemStat["baseStat"];
                toBeUpgradeArmor["enhanceLevel"] = currentSelectedItemStat["enhanceLevel"];
                toBeUpgradeArmor["requiredLevel"] = currentSelectedItemStat["requiredLevel"];
                toBeUpgradeArmor["position"] = i;
            } else if (currentSelectedItemStat["type"] == ITEM_TYPES["ACCESSORY"] && currentSelectedItemStat["baseStat"] > toBeUpgradeAccessory["baseStat"]) {
                toBeUpgradeAccessory["baseStat"] = currentSelectedItemStat["baseStat"];
                toBeUpgradeAccessory["enhanceLevel"] = currentSelectedItemStat["enhanceLevel"];
                toBeUpgradeAccessory["requiredLevel"] = currentSelectedItemStat["requiredLevel"];
                toBeUpgradeAccessory["position"] = i;
            }

            clickElementWithTag(CLOSE_EQUIPMENT_BUTTON_TAG);
        }

        let toBeUpgradeItem = {
            "requiredLevel": -1,
            "position": null
        }

        for (const l of [toBeUpgradeWeapon, toBeUpgradeAccessory, toBeUpgradeArmor]) {
            if (l["position"] != null && l["requiredLevel"] > toBeUpgradeItem["requiredLevel"] && l["enhanceLevel"] < SAFE_ENHANCE_LEVEL) {
                toBeUpgradeItem["requiredLevel"] = l["requiredLevel"];
                toBeUpgradeItem["position"] = l["position"]
            }
        }

        if (toBeUpgradeItem["position"] == null) {
            return;
        }

        if (toBeUpgradeItem["position"] == -1) {
            clickElementWithTag(EQUIPED_WEAPON_TAG);
        } else if (toBeUpgradeItem["position"] == -2) {
            clickElementWithTag(EQUIPED_ARMOR_TAG);
        } else if (toBeUpgradeItem["position"] == -3) {
            clickElementWithTag(EQUIPED_ACCESSORY_TAG);
        } else {
            currentInventoryItems[toBeUpgradeItem["position"]].click();
        }

        if (clickElementWithTag(ENHANCE_ITEM_TAG)) {
            console.log("[BOT] Upgraded Item"); // TO-DO: ADD ITEM NAME
            clickElementWithTag(CLOSE_EQUIPMENT_BUTTON_TAG);
            return true;
        } else {
            console.log("[BOT ERROR] ERROR WHEN UPGRADING EQUIPED WEAPON");
        }

        clickElementWithTag(CLOSE_EQUIPMENT_BUTTON_TAG);
        return false;

    }

    function EquipUpgradeAndDeleteItems(){
        while(true){
            equipBestInSlot();
            deleteWorseItems();
            while(safelyEnhanceItems()){}
            break;
        }
        
    }


    /******************************
     * MAIN LOOP
     ******************************/
    let lastLogTime = 0;
    
    setInterval(() => {
        const running = isActivityRunning();
        const now = Date.now();
        
        if (now - lastLogTime >= LOG_INTERVAL) {
            lastLogTime = now;
            console.log(`[BOT] Tick | HP: ${Math.round(getHPRatio()*100)}% | In Activity: ${running}`);
        }
        
        if (!running) {
            EquipUpgradeAndDeleteItems();
            chooseAdventure();
        }
    
    }, ACTION_INTERVAL);
})();