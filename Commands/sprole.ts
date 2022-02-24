import { Client, CommandInteraction, GuildMember } from "discord.js";
import { getCollections } from '../mongoDB'
import checkPermissions from "../Utils/checkPermissions";
import mongoSanitize from "express-mongo-sanitize";

const permsList = ["user", "admin"]

const sprole = async (interaction: CommandInteraction, client: Client, set: boolean): Promise<boolean> => {
    const role = interaction.options.getRole("role")! // Tell typescript to shut up cause it's gonna return a string and not null
    const collections = process.env.STOCKPILER_MULTI_SERVER === "true" ? getCollections(interaction.guildId) : getCollections()

    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false
    await interaction.reply({content: 'Working on it', ephemeral: true});
    if (set) {
        const perms = interaction.options.getString("perms")!
        if (!perms || !role) {
            await interaction.editReply({
                content: "Missing parameters"
            });
            return false
        }
        if (!permsList.includes(perms)) {
            await interaction.editReply({
                content: "Invalid permissions. Please use either 'admin' or 'user' (case-insensitive)."
            });
            return false
        }

       
        let updateObj: any = {}
        updateObj[perms] = role.id
        mongoSanitize.sanitize(updateObj, { replaceWith: "_" })
        await collections.config.updateOne({}, {$push: updateObj})
        await interaction.editReply({content: "Successfully added " + role.name + " to " + "'" + perms +"' perms."})

    }
    else {
        const configObj = (await collections.config.findOne({}))!
        let removed = false
        if ("admin" in configObj) {
            for (let i = 0; i < configObj.admin.length; i++) {
                if (configObj.admin[i] === role.id) {
                    mongoSanitize.sanitize(configObj, { replaceWith: "_" })
                    configObj.admin.slice(i, 1)
                    await collections.config.updateOne({}, {$set: {admin: configObj.admin}})
                    removed = true
                    break
                } 
            }
        }
        if ("user" in configObj && !removed) {
            for (let i = 0; i < configObj.user.length; i++) {
                if (configObj.user[i] === role.id) {
                    mongoSanitize.sanitize(configObj, { replaceWith: "_" })
                    configObj.user.slice(i, 1)
                    await collections.config.updateOne({}, {$set: {user: configObj.user}})
                    removed = true
                    break
                } 
            }
        }
        if (removed) await interaction.editReply({content: "Successfully removed '" + role.name + "' removed any permissions."})
        else await interaction.editReply({content: "'" + role.name + "' does not have any permissions in Stockpiler Bot."})
    }

    return true;
}

export default sprole
