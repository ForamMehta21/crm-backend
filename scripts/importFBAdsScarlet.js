const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const Admin = require('../models/Admin');
require('dotenv').config();

// Add the transcribed leads
//delete lead where ref is FB-Ads(Scarlet)
//delete lead where ref is FB-Ads(Scarlet)

const leadsData = [
  // --- Original FB-Ads leads (ref removed, duplicates removed) ---
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9429780540', fullName: 'Harshil Shah' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9558666727', fullName: 'Dhaval Shah' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9512113222', fullName: 'Piyu Mehta' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '7069999833', fullName: 'Unknown' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9712402287', fullName: 'Ruchit Khatsuria' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '8260797696', fullName: 'Darshini' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9424301233', fullName: 'Unknown' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '6351627239', fullName: 'Devang Shah', city: 'Himmatnagar' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9586573809', fullName: 'Chirag Prajapati' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9405264607', fullName: 'Purvi' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9904638543', fullName: 'Bharti Shah' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9904033199', fullName: 'Sushil Shah' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9016782891', fullName: 'Bijal Gosalia' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9879266522', fullName: 'PB' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9823313454', fullName: 'Gautam Shah' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9825710945', fullName: 'Anup Bhatia' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9898360230', fullName: 'Viral Shah' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '7383199210', fullName: 'Unknown' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9376881396', fullName: 'Nikita Aswani' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9824317376', fullName: 'Arpit Choksi' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9405695465', fullName: 'Bhakti' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9173928134', fullName: 'Twinkle Shah' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9879006990', fullName: 'Ankit Shah', preferredLocation: 'Shantivan', remarks: 'Weekend visit' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9726710797', fullName: 'Suman Shah' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9428374563', fullName: 'Milan Dagli', preferredLocation: 'Vasna' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '4204503765', fullName: 'Richa Shah', preferredLocation: 'Vasna' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9825169710', fullName: 'Mehul Vora', preferredLocation: 'Jainagar', remarks: 'Sunday visit Sent Reminder' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '8401682278', fullName: 'Dharmesh Shah', preferredLocation: 'Keshavnagar' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '7021322537', fullName: 'Krunal Hemarni', preferredLocation: 'Vadsar' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9726226264', fullName: 'Yuvraj', remarks: 'Sunday visit' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9426464538', fullName: 'Nita Sheth', preferredLocation: 'Jivraj Park' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9374155929', fullName: 'Meena Shah', remarks: 'Tomorrow visit Final @ 11 to 12. Ready to move. 70 to 80L - Naroda' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9825037841', fullName: 'Kalan Sheth', preferredLocation: 'Shantivan', remarks: 'Sat-Sun visit' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9601470841', fullName: 'Meena Doshi' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9429918291', fullName: 'Rutvi Shah', preferredLocation: 'Paldi' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9879341130', fullName: 'Pratik' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9173347093', fullName: 'Jigar Vakharia' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9909920328', fullName: 'Unknown' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9273077325', fullName: 'Dr. Sarthak Shah' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9428355411', fullName: 'Unknown' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9026063894', fullName: 'H.C. Khatsuria' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9825167396', fullName: 'Arihant' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9898118794', fullName: 'Kairav' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9725639228', fullName: 'Monik B Sanghvi' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '7383017540', fullName: 'Jalpa Adhiya' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9825559707', fullName: 'Mohit Shah' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9274447400', fullName: 'Jalak Shah' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9427326030', fullName: 'Mitesh' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '8160617293', fullName: 'CA Hitesh Tank' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '6351230280', fullName: 'Jay Shah' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9408570020', fullName: 'Sangita Shah', preferredLocation: 'Vasna', remarks: '26-03-26 Wednesday Ads: 3515 sqft - 4 BHK @ Palimal, 1st floor, Garden Facing, 2 car allotted parking. 2.61 -> All Incl. (Nego.)' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9909265425', fullName: 'Balubhai Solanki', preferredLocation: 'Vishala', remarks: 'Tomorrow visit' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9825203972', fullName: 'Mukeshbhai Dalwadi', preferredLocation: 'Krushnanagar' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9375157583', fullName: 'Jenish Parikh', preferredLocation: 'Shahibaug', remarks: 'Location x - Pritamnagar 2 Cr. 3/4 BHK' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9898160844', fullName: 'Kuval', remarks: '3 BHK - 1.25 Cr. - After 4 April call' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9173179031', fullName: 'Dakshi Doshi', remarks: 'Sat, Sun visit' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9424857012', fullName: 'Sneha Raval' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9409542922', fullName: 'Bhumi Kothari' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9586823758', fullName: 'Vikas Tiwari' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '7878387831', fullName: 'Ashish Shah', remarks: 'Weekend Sat-Sun Visit' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9427038325', fullName: 'Mitul Mehta' },

  // --- From Notebook Image 2 ---
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9327099927', fullName: 'Maunish Purohit' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9879433669', fullName: 'Bhavik Shah' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9428124257', fullName: 'Deepak Joshi' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '7873094892', fullName: 'Anantkumar Patil' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9428681170', fullName: 'Viraj Sanghvi' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9879165280', fullName: 'Unknown' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '7878757940', fullName: 'Sandy' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9772279037', fullName: 'Nalesh' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9536523809', fullName: 'Chirag Prajapati' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9898010450', fullName: 'Ketan' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9898665236', fullName: 'Unknown' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9687789222', fullName: 'Unknown' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '8238164060', fullName: 'Rahul Kothali' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9706064003', fullName: 'Unknown' },

  // --- From Notebook Image 3 ---
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9556007050', fullName: 'Marindersingh Mehta' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9727683175', fullName: 'Rutvi' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '7600020444', fullName: 'Silvi' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9769152178', fullName: 'Bhumi Desai' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '7405162179', fullName: 'Tarang Chauhan' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9879510041', fullName: 'Unknown' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9924006132', fullName: 'Nirav Shah' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9875114083', fullName: 'Khushi' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9099875412', fullName: 'Ketul Choksi' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9328193385', fullName: 'Hiten Dalvadi' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '7383738009', fullName: 'Neha Shah' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9824822933', fullName: 'JK.S.' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9712745566', fullName: 'Rupal' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9662135777', fullName: 'Mihir Patel' },

  // --- From Notebook Image 4 ---
  { ref: 'FB-Ads-Scarlet', phoneNumber: '7825336123', fullName: 'Raven Shmoff' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '8733899316', fullName: 'Pooja Salot' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '7561120618', fullName: 'Veen Khardaj' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9824975816', fullName: 'Abhik Shah' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9927399669', fullName: 'Avadh' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9173341093', fullName: 'Jigna R Vakhariya' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9819435387', fullName: 'Harsh Rathod' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '5334517765', fullName: 'Shah Ankit' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '8401942365', fullName: 'Vatsal Shah' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9427567127', fullName: 'Mahendra' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9974442618', fullName: 'Nishna Shah' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '8401142187', fullName: 'Kimit Vadhavankar' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '8530852874', fullName: 'Harshul Gandhi' },
  { ref: 'FB-Ads-Scarlet', phoneNumber: '9827019695', fullName: 'Nitin Jain' },
];

const importLeads = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://user:pass@cluster.mongodb.net");
        console.log('MongoDB connected');
        
        const superAdmin = await Admin.findOne({ role: 'Super Admin' }) || await Admin.findOne();
        if (!superAdmin) {
            console.error('No Admin found to assign leads to. Adding unassigned leads.');
        }

        const formattedLeads = leadsData.map(lead => ({
            ...lead,
            leadType: 'Buyer',
            leadStatus: 'New',
            assignedTo: superAdmin ? superAdmin._id : null
        }));

        for (let lead of formattedLeads) {
            const existing = await Lead.findOne({ phoneNumber: lead.phoneNumber, ref: 'FB-Ads(Scarlet)' });
            if (!existing) {
                if(lead.assignedTo) {
                    await Lead.create(lead);
                    console.log(`Imported: ${lead.fullName} (${lead.phoneNumber})`);
                } else {
                     console.log(`Error No admin assigned for ${lead.fullName}`);
                }
            } else {
                console.log(`Skipped (already exists): ${lead.fullName} (${lead.phoneNumber})`);
            }
        }
        
        console.log('Import completed');
        process.exit(0);
    } catch (error) {
        console.error('Error importing leads:', error);
        process.exit(1);
    }
};

importLeads();
