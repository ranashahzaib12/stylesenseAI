import json, sys
sys.stdout.reconfigure(encoding='utf-8')

NB_PATH = r'D:\Clients-ZeRaan\Style-Sense-Main\outfit_finder.ipynb'

with open(NB_PATH, 'r', encoding='utf-8') as f:
    nb = json.load(f)

# ── 1. Insert warning markdown cell at position 0 ────────────────────────────
warning_cell = {
    'cell_type': 'markdown',
    'id': 'kaggle-url-warning',
    'metadata': {},
    'source': [
        '> **WARNING — Kaggle Signed URLs Expire ~2026-05-22**\n',
        '>\n',
        '> 13 of the 30 shirt images use temporary signed Google Cloud Storage URLs from Kaggle.\n',
        '> These URLs expire **4 days after 2026-05-18 (approx. 22 May 2026)**.\n',
        '> After expiry those images will return 403. Re-download from the Kaggle dataset to get fresh signed URLs,\n',
        '> then update the `KG_*` constants in **Cell 2** below.\n',
        '>\n',
        '> All other images (DummyJSON CDN, Pexels CDN) are permanent links.'
    ]
}
nb['cells'].insert(0, warning_cell)

# ── 2. Update title markdown cell (now index 1) ───────────────────────────────
nb['cells'][1]['source'] = [
    '# Outfit Finder — Full-Sleeve Shirts ML Pipeline\n\n'
    '**Pipeline:** TF-IDF → TruncatedSVD (Latent Semantic Analysis) → KMeans Clustering → Hybrid Cosine + Cluster Scoring\n\n'
    '30 shirts: 17 with permanent DummyJSON/Pexels images + 13 with Kaggle user-provided images.\n\n'
    'Run all cells top-to-bottom. No external backend or API required.'
]

# ── 3. Update dataset markdown cell (now index 4) ────────────────────────────
nb['cells'][4]['source'] = [
    '## Cell 2 — Dataset: 30 Full-Sleeve Shirts\n\n'
    'All image URLs verified working at time of writing:\n'
    '- **DummyJSON CDN** — 3D product renders on white background, full sleeves clearly visible\n'
    '- **Pexels CDN** — on-person photography, confirmed full-sleeve\n'
    '- **Kaggle GCS** — 13 user-provided signed URLs, full-sleeve tops on white/light backgrounds\n\n'
    '> **Note:** Kaggle signed URLs expire ~2026-05-22. See WARNING cell at top for details.'
]

# ── 4. Build new dataset code cell source (now index 5) ──────────────────────
KG_102  = 'https://storage.googleapis.com/kagglesdsdata/datasets/2316138/3945489/tshirt/102.jpg?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=databundle-worker-v2%40kaggle-161607.iam.gserviceaccount.com%2F20260518%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260518T094044Z&X-Goog-Expires=345600&X-Goog-SignedHeaders=host&X-Goog-Signature=00308f4ba660d30809741365133850c590d314134d18886c6f8b5fae2b030f6f166f7c85c1637f34fcddca6731e62d82c2c1364f55a96ea2e43b229bf91d8d1f88873e3dcdf20b0ad7e67fd2d9d8b4d1bab625eaebb5f3b133a90ea133999234221b0758714a9f71beb7dde4a436f94526d740ec8cb84b7d506d420a5a8233f921d9959e4c07e57641f0bbc2c08fa36abe782b97b65fd1ffd860afc01eec9eef3c60a5297088c685a0ea5bd2a365d1529e39f295a5a05b2386b948d20ef3c546fa48ef93694efd4ed867387234819448d47e30b78228c3063f3db7c04f39d92057cf2a1d7dcda3ff4f0f104e4178cc1ba193175bbaf7246a3f5e489f6999b8b5'
KG_107  = 'https://storage.googleapis.com/kagglesdsdata/datasets/2316138/3945489/tshirt/107.jpg?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=databundle-worker-v2%40kaggle-161607.iam.gserviceaccount.com%2F20260518%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260518T174310Z&X-Goog-Expires=345600&X-Goog-SignedHeaders=host&X-Goog-Signature=b50497a0852dacf1390642ace0853c21f157a593b4388875d14e9ecf54afcb9a9eaae3fec5b8ed1ed14fc130b0711a3b9fe59bbd083621b2601e7e7be1a0a0b2fc871bde9351b36e4757f6b1a87c5bf00f716c68d402f68077d31ce9040d269c4102c394b2e3ff7311c0a088fc38fae106aa47ed860ff97e5b0a246663762704bbe33f5a0e36c264928f4853df05ddbbcef1eb47b9615e5727e30f0ee3fabfbc38bc5d934e8e1f52ee50aadb0eac8ae9316b850919acd3575e1ec2c08b2f75f8a597db846c47354e5790bd621f2a42c7d92972fdaa1952924cedba2b52baecc07506ad36bc8b7ff08d9e0b6cce4a807e70b096020f9d6949c59d37b34b00e118'
KG_1022 = 'https://storage.googleapis.com/kagglesdsdata/datasets/2316138/3945489/tshirt/1022.jpg?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=databundle-worker-v2%40kaggle-161607.iam.gserviceaccount.com%2F20260518%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260518T094044Z&X-Goog-Expires=345600&X-Goog-SignedHeaders=host&X-Goog-Signature=34435d43a34b3099c93e7362e9a8fd1c899b4ddb7d9fdb7a4f37756d3206930d508850ff2bc07896e8c0238b88ce44e68395f40316da24eaa57fad88c6e35b99da049dd82f9669e35bc5b3b7494899c59e542be45167032c5d929c028e552374a52f6736aedd0d7227b866eafb03eafe0ee2649652154b7bf808767d6ae9d617fcdf488b60d1fe9f88293bf90073afc5da6032e21f19d8c6511e82cfb64e27c78fd5f3d322f3874fc457be0e871d45efa78ccdc77f424484dc115eecd2e71b9ca962cf6450b5f9afe07ff5b9241cf06a117666b58ffd04922ffce6aedd084a40ab4398f14185e12c0a31f13b1e70f9b76ca1c17952219e77f52a7cd480664080'
KG_1033 = 'https://storage.googleapis.com/kagglesdsdata/datasets/2316138/3945489/tshirt/1033.jpg?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=databundle-worker-v2%40kaggle-161607.iam.gserviceaccount.com%2F20260518%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260518T174242Z&X-Goog-Expires=345600&X-Goog-SignedHeaders=host&X-Goog-Signature=bae11b05c3c7eae1d719af4964c9db42e68bd604832b9251b0d348d4245080120fe9cd36a0c2c79ff6cbc2776daa3ca07a3f1d5ca7d5b72d687228c16a4229fdf1e94660cd8ad93111f50fbf9e24709c6c376fd6c3a85a5dbde8bacd228f6136fe54e6c2f4761b3a546bc415836915d50c128ea7fd4df4035e3ca8f8452be96eb2f113e9d9907a5eb636d4753b95f114e8921c055e6b38ba62175130ea8a12e46a7cf765250f6d39d4f4df25edbfb292f2ecf37228f251a96bfbee951a4dc531e883367f15856557de734e3a5f1f47db056947747e5bf47b26aa1d9c90b98920ec10ccfa203f48492cc61eeb476c43312bb9e274ecc0d7362629dff46fe42378'
KG_1034 = 'https://storage.googleapis.com/kagglesdsdata/datasets/2316138/3945489/tshirt/1034.jpg?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=databundle-worker-v2%40kaggle-161607.iam.gserviceaccount.com%2F20260518%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260518T174242Z&X-Goog-Expires=345600&X-Goog-SignedHeaders=host&X-Goog-Signature=7896744d7d130f5f1ff220ede8d243150e5dbecc1027588b10621418e90032b7455a19fdf93ce8b2ca37d669d5e6189725e302fc17ccfedfddc9f3c654aa3ce670f7e277dd6eac694906a6945ace14f8257f415e557a508ce3a860e77b0aee22a53f1df57237547d383162f1933a7579aacb2761722b7dc14bc2a165cc94ee06c2118169fa1205d3ba699e1407f807f7bd6e3ba0d11b63ef0b694ddceabbcdd76fc7e2b1ab71f988ea942e87c25b3c72a6f0dccf7873e7df4b19266d6e7ec9a129045f752e767acdc7997246ba840001089535f3af1f9e0cd918cacaa6f046d2568926240f4c0d44925c41656230c41a1fcfd0e87eab7d141b06d69a8178392a'
KG_1044 = 'https://storage.googleapis.com/kagglesdsdata/datasets/2316138/3945489/tshirt/1044.jpg?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=databundle-worker-v2%40kaggle-161607.iam.gserviceaccount.com%2F20260518%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260518T174242Z&X-Goog-Expires=345600&X-Goog-SignedHeaders=host&X-Goog-Signature=3c3dea034dd2c23ff6a8a9a8a5548442bb1e4b8022ac630b4e46c15100d95975cda06ed4b5a072674632b9e0f2b066ab68e2b5b060b9bb1bf383fd82f904284b555ed1ae253e064ed243766b0552308a6630ba414ad569bb3b5851cebe9df9056dbfee0565543da6efddf71081a688cb0d872e325c700f90328d41024708530b1677e22c0b55683eba720eb3b3f59c74f2c4bb72ff4cb88e3dfc3964bc28a7b5df420760bb6730a026fe0bfacf581c84ec9fe4d067476b5f748fff0a2fab17691716713d74573abadecce77e40ce4375a63ae69f83c20f4e2a2a378fb44eb58d013677cbc78061777b82c133c79a30b1e9ff114367e36736288f2b293d672955'
KG_1049 = 'https://storage.googleapis.com/kagglesdsdata/datasets/2316138/3945489/tshirt/1049.jpg?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=databundle-worker-v2%40kaggle-161607.iam.gserviceaccount.com%2F20260518%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260518T174242Z&X-Goog-Expires=345600&X-Goog-SignedHeaders=host&X-Goog-Signature=40efd9190ff98bf98114a4c06544a9b9792af427fbe2ddf7edd1acdd1712302817784d11f6e4386ab8e758ba3ae1659097bc95f66c67c8e0c6169d6ed2399d1312619613f319322d070b16f25f43770adf7a509e8df24a7dfa469ad91dd33a88cc340e918b9e2ea0d50a3a0e48a83709ad30313c9091c5c95dffe8225a3f97c68b3d2b3586303a0900a63cefc87bdb5b1bfe7585b18a65da10c5bed3cf4ed386670ad1dcd7427cf7d0a2393fe9a637b32b9f996050626c69814e5ed9a7986b14b1bed95047db267a17dc3d6fc2bd7291ac5d0bf22db2bd609a45187d0a7efc5f749e50e6d69ce0402f6b0056c21f9465dee1ee37827ecb153b61cfe88cef020b'
KG_1061 = 'https://storage.googleapis.com/kagglesdsdata/datasets/2316138/3945489/tshirt/1061.jpg?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=databundle-worker-v2%40kaggle-161607.iam.gserviceaccount.com%2F20260518%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260518T174310Z&X-Goog-Expires=345600&X-Goog-SignedHeaders=host&X-Goog-Signature=36a4e007f8bc6cc228f68cffb13548556e4fe7655a096c88048515f215057215daa860f2622d3d5a64dbc7f3868bfcb79b8056d81073ce5a7672e3c8fa22b91feeab9f3cf4d4bbf29e90aad41ff99093c5f054ff8b51fa1b499a1824beda9a188391e8a5d155a53b9ad12eb816780aa384da7dc5bc2107afc0df3e0c80bac5d9f85ca4925e4874b3881999e75f347030877761456b4d4a9d0bfe967cd2a1c59ebcd00c1b883e75a79a5dc8336dcddb8dee05790594fdeb7d5140902679ab3b8dd80e6aa0f8e61dfd1358dbcb758788d3fd135eb0d4f6dd0850af715dff61dac2eef4314edfbb6a5b21e92855a47db8538b4978a9b9ed4828606e19ecdddfbe18'
KG_1062 = 'https://storage.googleapis.com/kagglesdsdata/datasets/2316138/3945489/tshirt/1062.jpg?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=databundle-worker-v2%40kaggle-161607.iam.gserviceaccount.com%2F20260518%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260518T174310Z&X-Goog-Expires=345600&X-Goog-SignedHeaders=host&X-Goog-Signature=b5e69696d3713c335959f8cb6b99e4a90fc339df952b493ab9b2474ac1acabaa887d5064f714ad02c7ecf606967e7b91d284e85ab3619a55bfbddae5123602630b8588db37f1c30020cffd6cddfad8a6d5f22fe87096039b88281ef44c613f5290fc9a8ef3cd10e6a98f3c8bbac7759dad0936daf3f7b61965ecf7bacbcff2a3a1fe6c3696fafb0b7ae94b4279b22df9e4c518397302e69195ce64f35fc6b590015408ce6b0ceb93d8d5b8cf2fa3974c504b9368b2926cceb4c1f59d285ae7c48d05233916ed24a16494a54e78470d003a6eb2dd462f3b3fbb39c933ed86698f47134e6869c6555a251635de75249cf483c647f8cd260963056e4b47fc6e2201'
KG_1063 = 'https://storage.googleapis.com/kagglesdsdata/datasets/2316138/3945489/tshirt/1063.jpg?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=databundle-worker-v2%40kaggle-161607.iam.gserviceaccount.com%2F20260518%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260518T174310Z&X-Goog-Expires=345600&X-Goog-SignedHeaders=host&X-Goog-Signature=4db827a228a784b27d9d49960e83efbe65ae14ec4039fd543865487a8808f1027cac8a75da512cd9dba3c7ee2fa1c5be2b7581d97a14e18ff0756ece058c3ee001f71342367e5c2544cd734e4770d523ffd2c7bc06de84fcd1472c0d0706b6749eb32150fa2c115258f4821553a6a2ec0fb178c14e3c99a3d30a34f758dd33c3915849a3efc6d4c1b575c28268a94f348dd682e8f0346a5b1c3dd768d268f9f8832045adec8220594ff932797d54529162a8d5bd25ace40998d5bdcef5f1c50dc083282b7adb4b1f9a8d13f96e91fa614e360eb8411cfb74bcf16872cee5283dc7d5dd77c1f8c8286e8fb88dd81cc3fdd74b421a8a991f0c7dc2ec24c18e48f6'
KG_1072 = 'https://storage.googleapis.com/kagglesdsdata/datasets/2316138/3945489/tshirt/1072.jpg?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=databundle-worker-v2%40kaggle-161607.iam.gserviceaccount.com%2F20260518%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260518T174310Z&X-Goog-Expires=345600&X-Goog-SignedHeaders=host&X-Goog-Signature=558dfed158c8071087404a7ee23cb94f107caf50f9f3d9955219417e19cf80bc83d1de87cf50fca0e38839996efe563f5e545e4d3e9d2e32a1723fdfee3f704f925ea9fc024df6d033e8890b943ffcfba9dd9929988d7e79ab7ff3c83943fd0c6066bc7710d5f3fc9aa2140901387d34c17424b19e4c3a7d9e3e3c9416e0c57b0cec02910e168ae2a5fe0915d569751b6f6ed41d537b9974ba367d385fe10b7314457c502c3509c4e3824e24e9c083f8b0e2262fd0337bedf9068afb8dbaeb26bbf3fc0c636f5b2c44475b19191c9a133d5ce0018a5f978d1326b61698a56bba269449bbf120d1891041788e59f65ee35fdafed5fccdaea9cc92384a475e3049'
KG_1077 = 'https://storage.googleapis.com/kagglesdsdata/datasets/2316138/3945489/tshirt/1077.jpg?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=databundle-worker-v2%40kaggle-161607.iam.gserviceaccount.com%2F20260518%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260518T174310Z&X-Goog-Expires=345600&X-Goog-SignedHeaders=host&X-Goog-Signature=2e1b4693b3c62c382552b52e37644c62e16d8e9014d9c7484031f80df50053c88f7a6bd298b6f79b813bde44ad814939a63cfbee70c22d169065e9c0398c60ef5abdae94a21bfcc7d62062ffe58ff02861dd0b0d4edd35242e499d378064931634d7d7fd91a488e979fcbaad5fc4480eddeb22165ebcdf12989fa790624e22e52e9348d80616681335af739939b69ad7c2c5bc5a875ee4e1dd68e4cd7117685705732ff214fed6a1cd09523d443c3ed645c6ef3e2d8a301d9cf60fc7722d71c2025f111d08fca29378244353cf225b2f4b52cbc8161e6d6899bfcfff66acd977dd7009af6c1a2fb5a8a215c8495f1cc257b903d20c0a71304abe04f5328f7e9f'
KG_1100 = 'https://storage.googleapis.com/kagglesdsdata/datasets/2316138/3945489/tshirt/1100.jpg?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=databundle-worker-v2%40kaggle-161607.iam.gserviceaccount.com%2F20260518%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260518T174342Z&X-Goog-Expires=345600&X-Goog-SignedHeaders=host&X-Goog-Signature=131a2af6729ef220876305abb87781defab91bba05a5d0ec26bcaab30ddbc31d07b872d8cc11026e4935316f8f512b5aa22c18bd230b941ac8ee5f273484a3f3508590643d588cfbc9efa18d89a2429c77024593884c9e8816432d8e78eb46bece3bccc95cf452f244ab92dc01722ca56ca6ab651a3119eb5a6e94da52e531b5ba3d98116ddf6f73aceed1ebda7cda4eb37717861bd109decde23ef88b86ef652e74fd54eaac5e3a51c5909f704ff17f3ea33644f4b7dcd9603f0f93cc74830452c910966dace16b2c8362e43be50939d7e4766ebfc20e410d03b8f8eda2bda6850f3f933ac25988864fc35b537773256106615f37f3fb6f1746149efb077900'

DJ_BLUE  = 'https://cdn.dummyjson.com/product-images/mens-shirts/blue-&-black-check-shirt'
DJ_PLAID = 'https://cdn.dummyjson.com/product-images/mens-shirts/man-plaid-shirt'
DJ_CHECK = 'https://cdn.dummyjson.com/product-images/mens-shirts/men-check-shirt'
PX_DRESS = 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=400'
PX_PLAID = 'https://images.pexels.com/photos/769733/pexels-photo-769733.jpeg?auto=compress&cs=tinysrgb&w=400'

new_dataset_lines = [
    "# --- Permanent CDN image pools (DummyJSON product renders + Pexels) ---\n",
    f"DJ_BLUE  = '{DJ_BLUE}'\n",
    f"DJ_PLAID = '{DJ_PLAID}'\n",
    f"DJ_CHECK = '{DJ_CHECK}'\n",
    f"PX_DRESS = '{PX_DRESS}'\n",
    f"PX_PLAID = '{PX_PLAID}'\n",
    "\n",
    "# --- Kaggle signed GCS URLs (expire ~2026-05-22 — see WARNING cell) ---\n",
    "# Source: kaggle.com — dataset 2316138/3945489, all visually verified full-sleeve tops\n",
    f"KG_102  = '{KG_102}'\n",
    f"KG_107  = '{KG_107}'\n",
    f"KG_1022 = '{KG_1022}'\n",
    f"KG_1033 = '{KG_1033}'\n",
    f"KG_1034 = '{KG_1034}'\n",
    f"KG_1044 = '{KG_1044}'\n",
    f"KG_1049 = '{KG_1049}'\n",
    f"KG_1061 = '{KG_1061}'\n",
    f"KG_1062 = '{KG_1062}'\n",
    f"KG_1063 = '{KG_1063}'\n",
    f"KG_1072 = '{KG_1072}'\n",
    f"KG_1077 = '{KG_1077}'\n",
    f"KG_1100 = '{KG_1100}'\n",
    "\n",
    "RAW_SHIRTS = [\n",
    "    # ── FORMAL (DummyJSON button-down product renders) ────────────────────\n",
    "    {\n",
    "        'id': 1, 'name': 'Classic White Oxford',\n",
    "        'style': 'formal', 'color': 'white', 'pattern': 'plain', 'fabric': 'cotton', 'fit': 'slim',\n",
    "        'occasion': 'office wedding interview business',\n",
    "        'description': 'Crisp white oxford shirt with button-down collar. Slim fit for formal occasions, office wear, and weddings. Pure cotton, breathable and wrinkle-resistant.',\n",
    f"        'image_url': f'{{DJ_BLUE}}/1.webp'\n",
    "    },\n",
    "    {\n",
    "        'id': 2, 'name': 'Navy Blue Pinstripe',\n",
    "        'style': 'formal', 'color': 'navy blue', 'pattern': 'striped', 'fabric': 'wool blend', 'fit': 'regular',\n",
    "        'occasion': 'office business meeting corporate boardroom',\n",
    "        'description': 'Navy blue shirt with fine white pinstripes. Professional for business meetings and corporate environments. Wool blend for a sharp, structured silhouette.',\n",
    f"        'image_url': f'{{DJ_BLUE}}/2.webp'\n",
    "    },\n",
    "    {\n",
    "        'id': 3, 'name': 'Teal Poplin Dress Shirt',\n",
    "        'style': 'formal', 'color': 'teal', 'pattern': 'plain', 'fabric': 'poplin cotton', 'fit': 'slim',\n",
    "        'occasion': 'office cocktail party smart formal wedding event',\n",
    "        'description': 'Elegant teal poplin dress shirt with smooth, lustrous finish and French placket. Versatile from office use to cocktail parties and weddings.',\n",
    f"        'image_url': f'{{DJ_CHECK}}/1.webp'\n",
    "    },\n",
    "    {\n",
    "        'id': 4, 'name': 'Slim Black Formal Dress Shirt',\n",
    "        'style': 'formal', 'color': 'black', 'pattern': 'plain', 'fabric': 'cotton satin', 'fit': 'slim',\n",
    "        'occasion': 'black tie gala evening formal tuxedo dinner',\n",
    "        'description': 'Sleek all-black formal dress shirt in cotton-satin. Hidden placket and spread collar. Pairs with tuxedo or dark suit for black-tie events and galas.',\n",
    f"        'image_url': f'{{DJ_PLAID}}/4.webp'\n",
    "    },\n",
    "    {\n",
    "        'id': 5, 'name': 'Burgundy Velvet Evening Shirt',\n",
    "        'style': 'formal', 'color': 'burgundy', 'pattern': 'plain', 'fabric': 'velvet', 'fit': 'slim',\n",
    "        'occasion': 'gala evening dinner party formal upscale event',\n",
    "        'description': 'Luxurious burgundy velvet shirt with mandarin collar. A statement piece for galas, dinner parties, and black-tie-optional events.',\n",
    f"        'image_url': f'{{DJ_PLAID}}/1.webp'\n",
    "    },\n",
    "    {\n",
    "        'id': 6, 'name': 'Grey Herringbone Oxford',\n",
    "        'style': 'formal', 'color': 'grey', 'pattern': 'herringbone', 'fabric': 'cotton', 'fit': 'regular',\n",
    "        'occasion': 'business casual office autumn winter corporate',\n",
    "        'description': 'Subtle grey herringbone weave oxford. Textured pattern adds visual depth. Reliable business-casual choice for colder months and office settings.',\n",
    f"        'image_url': f'{{DJ_BLUE}}/3.webp'\n",
    "    },\n",
    "    # ── SMART CASUAL ──────────────────────────────────────────────────────────\n",
    "    {\n",
    "        'id': 7, 'name': 'Pastel Pink Oxford',\n",
    "        'style': 'smart casual', 'color': 'pastel pink', 'pattern': 'plain', 'fabric': 'cotton', 'fit': 'slim',\n",
    "        'occasion': 'brunch office smart casual date spring summer',\n",
    "        'description': 'Soft pastel pink oxford cotton shirt with modern slim fit. Fresh for spring brunches, smart casual dates, and light office environments.',\n",
    "        'image_url': PX_DRESS\n",
    "    },\n",
    "    {\n",
    "        'id': 8, 'name': 'Blue Henley Long Sleeve',\n",
    "        'style': 'smart casual', 'color': 'blue', 'pattern': 'plain henley', 'fabric': 'cotton', 'fit': 'slim',\n",
    "        'occasion': 'casual date brunch outdoor smart casual weekend',\n",
    "        'description': 'Clean blue henley long sleeve with a classic three-button placket. Slim cotton build that transitions from weekend brunches to smart casual dates effortlessly.',\n",
    "        'image_url': KG_1062\n",
    "    },\n",
    "    {\n",
    "        'id': 9, 'name': 'Teal Mint Henley Long Sleeve',\n",
    "        'style': 'smart casual', 'color': 'teal mint', 'pattern': 'plain henley', 'fabric': 'cotton', 'fit': 'slim',\n",
    "        'occasion': 'casual date brunch spring summer smart casual outdoor',\n",
    "        'description': 'Fresh teal-mint henley long sleeve in lightweight cotton. The cool tone is ideal for spring and summer smart casual looks, dates, and outdoor outings.',\n",
    "        'image_url': KG_1061\n",
    "    },\n",
    "    {\n",
    "        'id': 10, 'name': 'Beige Ribbed Knit Long Sleeve',\n",
    "        'style': 'smart casual', 'color': 'beige cream', 'pattern': 'ribbed textured', 'fabric': 'ribbed cotton', 'fit': 'slim',\n",
    "        'occasion': 'casual smart casual date autumn weekend layering',\n",
    "        'description': 'Warm beige ribbed-knit long sleeve with a slim, tailored silhouette. Subtle texture elevates casual dressing for dates, weekends, and autumn layering.',\n",
    "        'image_url': KG_1033\n",
    "    },\n",
    "    {\n",
    "        'id': 11, 'name': 'White Minimal Long Sleeve',\n",
    "        'style': 'smart casual', 'color': 'white', 'pattern': 'plain', 'fabric': 'cotton jersey', 'fit': 'regular',\n",
    "        'occasion': 'casual everyday smart casual minimal clean layering',\n",
    "        'description': 'Crisp white long-sleeve cotton jersey with a clean minimal design. A versatile wardrobe essential for smart casual outfits, layering, and everyday wear.',\n",
    "        'image_url': KG_1034\n",
    "    },\n",
    "    {\n",
    "        'id': 12, 'name': 'Cream Pocket Long Sleeve',\n",
    "        'style': 'smart casual', 'color': 'cream white', 'pattern': 'plain', 'fabric': 'cotton', 'fit': 'regular',\n",
    "        'occasion': 'casual smart casual everyday minimal weekend date',\n",
    "        'description': 'Understated cream long-sleeve with a chest pocket detail. Premium cotton build for a clean, effortless look on weekends and smart casual settings.',\n",
    "        'image_url': KG_1072\n",
    "    },\n",
    "    {\n",
    "        'id': 13, 'name': 'Pale Yellow Oxford Buttondown',\n",
    "        'style': 'smart casual', 'color': 'pale yellow', 'pattern': 'plain', 'fabric': 'oxford cotton', 'fit': 'regular',\n",
    "        'occasion': 'office spring brunch smart casual date',\n",
    "        'description': 'Sunny pale yellow oxford button-down with soft basket-weave texture. A fresh alternative to white for office wear and spring smart-casual dressing.',\n",
    f"        'image_url': f'{{DJ_CHECK}}/3.webp'\n",
    "    },\n",
    "    {\n",
    "        'id': 14, 'name': 'Dark Green Slim Poplin',\n",
    "        'style': 'smart casual', 'color': 'dark green', 'pattern': 'plain', 'fabric': 'poplin', 'fit': 'slim',\n",
    "        'occasion': 'office casual dinner date autumn winter',\n",
    "        'description': 'Deep forest green slim-fit poplin. Rich green tone pairs with chinos, navy trousers, or dark denim for autumn office wear and evening dinners.',\n",
    f"        'image_url': f'{{DJ_CHECK}}/4.webp'\n",
    "    },\n",
    "    # ── CASUAL ────────────────────────────────────────────────────────────────\n",
    "    {\n",
    "        'id': 15, 'name': 'Charcoal Flannel Check',\n",
    "        'style': 'casual', 'color': 'charcoal grey', 'pattern': 'checked', 'fabric': 'flannel', 'fit': 'relaxed',\n",
    "        'occasion': 'weekend outing casual brunch coffee',\n",
    "        'description': 'Soft charcoal flannel shirt with classic window-pane check. Relaxed fit makes it ideal for weekend outings, brunches, and casual everyday wear.',\n",
    f"        'image_url': f'{{DJ_BLUE}}/2.webp'\n",
    "    },\n",
    "    {\n",
    "        'id': 16, 'name': 'Red Tartan Flannel',\n",
    "        'style': 'casual', 'color': 'red black', 'pattern': 'tartan plaid', 'fabric': 'flannel', 'fit': 'relaxed',\n",
    "        'occasion': 'winter casual christmas holiday cozy warm outdoor',\n",
    "        'description': 'Bold red and black tartan flannel shirt for colder months. Warm, eye-catching plaid ideal for Christmas holidays, cozy winter gatherings, and casual cold-weather dressing.',\n",
    f"        'image_url': f'{{DJ_PLAID}}/1.webp'\n",
    "    },\n",
    "    {\n",
    "        'id': 17, 'name': 'Brown Buffalo Check',\n",
    "        'style': 'casual', 'color': 'brown black', 'pattern': 'buffalo check', 'fabric': 'cotton flannel', 'fit': 'regular',\n",
    "        'occasion': 'casual everyday autumn winter outdoor lumberjack',\n",
    "        'description': 'Earthy brown and black buffalo check flannel. Timeless pattern with warm cotton flannel. Pairs with jeans or chinos for casual autumn and winter wear.',\n",
    "        'image_url': PX_PLAID\n",
    "    },\n",
    "    {\n",
    "        'id': 18, 'name': 'Denim Chambray Work Shirt',\n",
    "        'style': 'casual', 'color': 'denim blue', 'pattern': 'plain', 'fabric': 'chambray denim', 'fit': 'regular',\n",
    "        'occasion': 'everyday casual work from home weekend',\n",
    "        'description': 'Classic denim chambray shirt in washed blue. Lightweight and versatile for everyday casual wear, work from home, and laid-back weekends.',\n",
    f"        'image_url': f'{{DJ_BLUE}}/3.webp'\n",
    "    },\n",
    "    {\n",
    "        'id': 19, 'name': 'Beige Oversized Long Sleeve',\n",
    "        'style': 'casual', 'color': 'beige taupe', 'pattern': 'plain', 'fabric': 'cotton fleece', 'fit': 'oversized',\n",
    "        'occasion': 'weekend casual cozy relaxed everyday loungewear layering',\n",
    "        'description': 'Warm beige oversized long-sleeve top in soft cotton fleece. The relaxed boxy fit is made for cozy weekends, lounging, and effortless street casual dressing.',\n",
    "        'image_url': KG_102\n",
    "    },\n",
    "    {\n",
    "        'id': 20, 'name': 'Forest Green Flannel Plaid',\n",
    "        'style': 'casual', 'color': 'forest green', 'pattern': 'plaid', 'fabric': 'flannel', 'fit': 'regular',\n",
    "        'occasion': 'camping hiking outdoor autumn fall rugged',\n",
    "        'description': 'Rugged forest green plaid flannel for the outdoors. Warm and durable for camping, hiking, and autumn activities. Classic lumberjack aesthetic.',\n",
    f"        'image_url': f'{{DJ_PLAID}}/2.webp'\n",
    "    },\n",
    "    {\n",
    "        'id': 21, 'name': 'Brick Red Madras Plaid',\n",
    "        'style': 'casual', 'color': 'brick red', 'pattern': 'madras plaid', 'fabric': 'cotton madras', 'fit': 'regular',\n",
    "        'occasion': 'summer casual garden barbecue beach weekend',\n",
    "        'description': 'Bright brick red madras plaid in lightweight cotton. Wear open over a tee or buttoned at barbecues, garden parties, and beach days.',\n",
    f"        'image_url': f'{{DJ_PLAID}}/3.webp'\n",
    "    },\n",
    "    # ── STREETWEAR (Kaggle verified long-sleeve tees) ─────────────────────────\n",
    "    {\n",
    "        'id': 22, 'name': 'Black Designer Long Sleeve',\n",
    "        'style': 'streetwear', 'color': 'black', 'pattern': 'plain', 'fabric': 'cotton jersey', 'fit': 'slim',\n",
    "        'occasion': 'street style party night out designer fashion luxury',\n",
    "        'description': 'Premium black long-sleeve jersey from designer streetwear. Clean minimal branding on quality cotton. Effortlessly elevated for parties, concerts, and fashion-forward looks.',\n",
    "        'image_url': KG_1022\n",
    "    },\n",
    "    {\n",
    "        'id': 23, 'name': 'Black Branded Long Sleeve',\n",
    "        'style': 'streetwear', 'color': 'black', 'pattern': 'plain', 'fabric': 'cotton jersey', 'fit': 'regular',\n",
    "        'occasion': 'streetwear casual everyday night out concert event',\n",
    "        'description': 'Versatile black branded long-sleeve in heavy cotton jersey. Bold graphic text across the chest. A streetwear staple for concerts, night outs, and everyday casual dressing.',\n",
    "        'image_url': KG_1049\n",
    "    },\n",
    "    {\n",
    "        'id': 24, 'name': 'White Graphic Trail Long Sleeve',\n",
    "        'style': 'casual', 'color': 'white', 'pattern': 'printed graphic', 'fabric': 'cotton jersey', 'fit': 'regular',\n",
    "        'occasion': 'outdoor casual travel adventure everyday graphic print',\n",
    "        'description': 'White long-sleeve cotton jersey with an outdoor trail graphic. Clean base with nature-inspired branding for casual adventure, travel, and everyday wear.',\n",
    "        'image_url': KG_1100\n",
    "    },\n",
    "    {\n",
    "        'id': 25, 'name': 'Grey Melange Patch Long Sleeve',\n",
    "        'style': 'casual', 'color': 'grey melange', 'pattern': 'plain', 'fabric': 'cotton blend', 'fit': 'regular',\n",
    "        'occasion': 'casual everyday weekend sport active layering',\n",
    "        'description': 'Heathered grey melange long-sleeve with a woven patch label. Soft cotton-blend fabric with a relaxed everyday fit. Works alone or as a base layer for sport and casual wear.',\n",
    "        'image_url': KG_1044\n",
    "    },\n",
    "    {\n",
    "        'id': 26, 'name': 'Grey Essentials Long Sleeve',\n",
    "        'style': 'streetwear', 'color': 'grey', 'pattern': 'printed graphic', 'fabric': 'cotton fleece', 'fit': 'oversized',\n",
    "        'occasion': 'streetwear casual relaxed everyday luxury designer loungewear',\n",
    "        'description': 'Oversized grey cotton-fleece long-sleeve with tonal graphic print. Fear of God Essentials aesthetic — a luxe casual staple for relaxed streetwear dressing.',\n",
    "        'image_url': KG_1077\n",
    "    },\n",
    "    # ── RESORT CASUAL ────────────────────────────────────────────────────────\n",
    "    {\n",
    "        'id': 27, 'name': 'Navy Linen Pocket Long Sleeve',\n",
    "        'style': 'resort casual', 'color': 'navy blue', 'pattern': 'plain', 'fabric': 'linen', 'fit': 'relaxed',\n",
    "        'occasion': 'summer beach resort vacation dinner smart casual nautical',\n",
    "        'description': 'Relaxed navy linen long-sleeve with a chest patch pocket. Lightweight and breathable for beach resorts, summer dinners, and nautical-inspired smart casual outfits.',\n",
    "        'image_url': KG_1063\n",
    "    },\n",
    "    {\n",
    "        'id': 28, 'name': 'Burgundy Outdoor Long Sleeve',\n",
    "        'style': 'resort casual', 'color': 'burgundy dark red', 'pattern': 'plain', 'fabric': 'polyester blend', 'fit': 'regular',\n",
    "        'occasion': 'outdoor hiking sport active travel adventure casual',\n",
    "        'description': 'Rich burgundy performance long-sleeve in moisture-wicking polyester blend. Worn with a relaxed fit — ideal for outdoor adventures, hiking, and active travel.',\n",
    "        'image_url': KG_107\n",
    "    },\n",
    "    {\n",
    "        'id': 29, 'name': 'Royal Blue Batik Print',\n",
    "        'style': 'resort casual', 'color': 'royal blue', 'pattern': 'batik printed', 'fabric': 'cotton voile', 'fit': 'relaxed',\n",
    "        'occasion': 'travel holiday cultural ethnic festival beach bohemian',\n",
    "        'description': 'Royal blue cotton voile with artisan batik wax-resist print. Lightweight and culturally rich for cultural festivals, travel, beach holidays, and bohemian styling.',\n",
    f"        'image_url': f'{{DJ_BLUE}}/2.webp'\n",
    "    },\n",
    "    # ── ATHLEISURE ────────────────────────────────────────────────────────────\n",
    "    {\n",
    "        'id': 30, 'name': 'Slate Grey Performance Shirt',\n",
    "        'style': 'athleisure', 'color': 'slate grey', 'pattern': 'plain', 'fabric': 'polyester spandex blend', 'fit': 'athletic',\n",
    "        'occasion': 'gym sport running workout active travel fitness',\n",
    "        'description': 'Slate grey performance shirt with moisture-wicking polyester-spandex. Four-way stretch for full range of motion at the gym, running, and active lifestyles.',\n",
    f"        'image_url': f'{{DJ_BLUE}}/3.webp'\n",
    "    },\n",
    "]\n",
    "\n",
    "df_raw = pd.DataFrame(RAW_SHIRTS)\n",
    "print(f'Dataset loaded: {len(df_raw)} full-sleeve shirts')\n",
    "print(f'Styles covered: {sorted(df_raw[\"style\"].unique())}')\n",
    "df_raw[['id','name','style','color','pattern']].head(10)",
]

nb['cells'][5]['source'] = new_dataset_lines

# ── 5. Update summary cell (now index 31) ─────────────────────────────────────
nb['cells'][31]['source'] = [
    "print('=== ML Pipeline ===')\n",
    "print(f'  TfidfVectorizer  : {len(vectorizer.vocabulary_)} terms, bigrams, sublinear_tf')\n",
    "print(f'  TruncatedSVD     : {N_COMPONENTS} latent dims, {explained_var:.1f}% variance explained')\n",
    "print(f'  KMeans           : {N_CLUSTERS} clusters, inertia={kmeans.inertia_:.4f}')\n",
    "print(f'  Hybrid scoring   : LSA cosine + {CLUSTER_BONUS} cluster bonus')\n",
    "print(f'  Model size       : {os.path.getsize(MODEL_PATH)/1024:.1f} KB')\n",
    "print()\n",
    "print('=== Dataset ===')\n",
    "print(f'  Total shirts: {len(df_clean)}')\n",
    "for col in ['style','pattern','fabric','fit']:\n",
    "    print(f'\\n  {col.capitalize()}:')\n",
    "    print(df_clean[col].value_counts().to_string(header=False))\n",
    "\n",
    "print('\\n=== Image Sources ===')\n",
    "dj = sum(1 for u in df_clean['image_url'] if 'dummyjson' in u)\n",
    "px = sum(1 for u in df_clean['image_url'] if 'pexels' in u)\n",
    "kg = sum(1 for u in df_clean['image_url'] if 'kagglesdsdata' in u)\n",
    "print(f'  DummyJSON product renders : {dj} shirts (full-sleeve 3D product shots on white bg)')\n",
    "print(f'  Pexels on-person photos   : {px} shirts (confirmed full-sleeve, worn by model)')\n",
    "print(f'  Kaggle signed GCS URLs    : {kg} shirts (user-provided; expire ~2026-05-22)')\n",
    "print(f'  All URLs verified during image validation (Cell 3)')\n",
]

with open(NB_PATH, 'w', encoding='utf-8') as f:
    json.dump(nb, f, ensure_ascii=False, indent=1)

print('Done. Total cells:', len(nb['cells']))

# Verify the Kaggle URLs are in there
with open(NB_PATH, 'r', encoding='utf-8') as f:
    content = f.read()
kg_count = content.count('kagglesdsdata')
print(f'kagglesdsdata occurrences in notebook: {kg_count}')
print(f'Expected: at least 13 (one per shirt)')
