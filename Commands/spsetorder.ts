import { CommandInteraction, GuildMember, Client } from "discord.js";
import { getCollections } from './../mongoDB';
import checkPermissions from "../Utils/checkPermissions";
import generateStockpileMsg from "./../Utils/generateStockpileMsg"
import updateStockpileMsg from "../Utils/updateStockpileMsg";


const spsetorder = async (interaction: CommandInteraction, client: Client): Promise<boolean> => {
    const stockpile = interaction.options.getString("stockpile")! // Tell typescript to shut up and it is non-null
    let order = interaction.options.getInteger("order")!
    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false
    
    if (!stockpile || !order) {
        await interaction.reply({
            content: "Missing parameters",
            ephemeral: true
        });
        return false
    }

    await interaction.reply({content: "Working on it", ephemeral: true})

    const collections = getCollections()
    const configObj = (await collections.config.findOne({}))!
    let orderSettings: any = []    
    if ("orderSettings" in configObj) {
        orderSettings = configObj.orderSettings
    }
    else {
        const stockpileList = await collections.stockpiles.find({}).toArray()
        for (let i = 0; i < stockpileList.length; i++) {
            orderSettings.push(stockpileList[i].name)
        }
    }

    order -= 1
    if (order >= orderSettings.length) {
        await interaction.editReply({
            content: "Error, your position order is more than the number of stockpiles. You can select a position from 1 to " + orderSettings.length.toString() 
        })
    }
    const position = orderSettings.indexOf(stockpile)
    if (position === -1) {
        await interaction.editReply({
            content: "The stockpile '" + stockpile + "' was not found."
        })
        return false;
    }

    // Start inserting
    const temp = orderSettings.splice(position, 1)[0];
    orderSettings.splice(order, 0, temp)

    await collections.config.updateOne({}, {$set: {orderSettings: orderSettings}})
    const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, stockpileNames] = await generateStockpileMsg(true)
        await updateStockpileMsg(client, [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader], stockpileNames)
        
    await interaction.editReply({
        content: "Order of '" + stockpile + "' stockpile changed to number " + (order+1).toString(),
    });

    return true;
}

export default spsetorder
